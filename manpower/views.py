import json
import random
import calendar
from datetime import datetime, date, timedelta
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from django.db.models import Count

from inventory.models import Center
from .models import Contractor, Person, DailyRecord, AttendanceEntry

@login_required
def manpower_dashboard(request):
    centers = Center.objects.all().order_by('name')
    contractors = Contractor.objects.all().order_by('name')
    return render(request, 'manpower/dashboard.html', {'centers': centers, 'contractors': contractors})

@login_required
def workers_directory(request):
    # Update: checks dailyrecord instead of attendancesheet
    centers = Center.objects.annotate(sheet_count=Count('dailyrecord'))
    if centers.filter(sheet_count__gt=0).exists():
        centers = centers.filter(sheet_count__gt=0).order_by('name')
    else:
        centers = centers.order_by('name') 
        
    contractors = Contractor.objects.all().order_by('name')
    return render(request, 'manpower/directory.html', {'centers': centers, 'contractors': contractors})

@login_required
def api_get_workers(request, center_id):
    affiliation = request.GET.get('type', 'company')
    is_company = (affiliation == 'company')
    workers = Person.objects.filter(center_id=center_id, is_company_staff=is_company)
    data = [{'id': w.id, 'name': w.name, 'role': w.role, 'shift': w.shift_preference, 'contractor_name': w.contractor.name if w.contractor else ''} for w in workers]
    return JsonResponse({'workers': data})

@login_required
@require_POST
def api_save_workers(request):
    try:
        data = json.loads(request.body)
        center_id = data.get('center_id')
        affiliation = data.get('affiliation')
        workers = data.get('workers', [])
        
        center = Center.objects.get(id=center_id)
        is_company = (affiliation == 'company')
        
        for w in workers:
            worker_id = w.get('id')
            name = w.get('name').strip()
            if not name: continue
            
            contractor_obj = None
            if not is_company:
                c_name = w.get('contractor_name', '').strip()
                if c_name:
                    contractor_obj, _ = Contractor.objects.get_or_create(name__iexact=c_name, defaults={'name': c_name})

            if isinstance(worker_id, int):
                person = Person.objects.filter(id=worker_id).first()
                if person:
                    person.name = name; person.role = w.get('role'); person.shift_preference = w.get('shift'); person.contractor = contractor_obj; person.save()
            else:
                Person.objects.create(name=name, role=w.get('role'), shift_preference=w.get('shift'), is_company_staff=is_company, contractor=contractor_obj, center=center)
                
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

@login_required
@require_POST
def api_save_attendance(request):
    try:
        center_id = request.POST.get('center_id')
        date_str = request.POST.get('date')
        day_prod = request.POST.get('day_production', 0)
        night_prod = request.POST.get('night_production', 0)
        roster_data = json.loads(request.POST.get('roster', '[]'))
        image = request.FILES.get('sheet_image')

        center = Center.objects.get(id=center_id)

        # 1. Create or Update the ONE Daily Record
        record, created = DailyRecord.objects.get_or_create(
            center=center, date=date_str,
            defaults={'file': image, 'day_production_kgs': day_prod, 'night_production_kgs': night_prod}
        )
        if not created:
            record.day_production_kgs = day_prod
            record.night_production_kgs = night_prod
            if image: record.file = image
            record.save()
            record.entries.all().delete() # Wipe old entries for a clean re-save

        # 2. Process Roster
        for w in roster_data:
            name = w.get('name', '').strip()
            if not name: continue
            
            is_company = (w.get('affiliation', 'Company') == 'Company')
            c_name = w.get('contractor_name', '').strip()
            
            contractor_obj = None
            if not is_company and c_name:
                contractor_obj, _ = Contractor.objects.get_or_create(name__iexact=c_name, defaults={'name': c_name})

            person, _ = Person.objects.get_or_create(
                name=name, center=center,
                defaults={'role': w.get('role', 'Worker'), 'is_company_staff': is_company, 'contractor': contractor_obj, 'shift_preference': w.get('shift', 'Day')}
            )

            AttendanceEntry.objects.create(record=record, person=person, shift=w.get('shift', 'Day'), raw_scanned_name=name)

        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

@login_required
def contractors_hub(request):
    contractors = Contractor.objects.annotate(total_registered=Count('person', distinct=True)).order_by('name')
    return render(request, 'manpower/contractors.html', {'contractors': contractors})

@login_required
def api_contractor_analytics(request, contractor_id):
    try:
        now = datetime.now()
        year = int(request.GET.get('year', now.year))
        month = int(request.GET.get('month', now.month))
        contractor = Contractor.objects.get(id=contractor_id)
        
        centers = Center.objects.filter(manpower_people__contractor=contractor).distinct()
        center_names = [c.name for c in centers]
        total_workers = Person.objects.filter(contractor=contractor).count()
        
        # Look at entries tied to a DailyRecord
        entries = AttendanceEntry.objects.filter(
            person__contractor=contractor,
            record__date__year=year,
            record__date__month=month
        ).values('record__date').annotate(unique_count=Count('person', distinct=True)).order_by('record__date')
        
        daily_data = {entry['record__date'].strftime('%Y-%m-%d'): entry['unique_count'] for entry in entries}
        
        num_days = calendar.monthrange(year, month)[1]
        chart_data = []
        max_count = 0
        
        for day in range(1, num_days + 1):
            date_str = f"{year}-{month:02d}-{day:02d}"
            count = daily_data.get(date_str, 0)
            if count > max_count: max_count = count
            chart_data.append({'day': day, 'date': date_str, 'count': count})
            
        return JsonResponse({'status': 'success', 'contractor': contractor.name, 'total_workers': total_workers, 'centers': center_names, 'chart_data': chart_data, 'max_count': max_count or 1})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

# ==========================================
# DEV TOOLS: GOD MODE GENERATOR
# ==========================================
@login_required
def dev_tools(request):
    return render(request, 'manpower/dev_tools.html')

@login_required
@require_POST
def seed_dummy_data(request):
    center = Center.objects.first()
    if not center: return JsonResponse({'status': 'error', 'message': 'Create a Center in Inventory App first!'})

    DailyRecord.objects.filter(date__year=2026, date__month=2).delete()
    c1, _ = Contractor.objects.get_or_create(name="Apex Labour Force")
    c2, _ = Contractor.objects.get_or_create(name="Titan Industrial Services")

    people = []
    for i in range(15):
        p, _ = Person.objects.get_or_create(name=f"Apex Worker {i}", center=center, contractor=c1, is_company_staff=False)
        people.append(p)
    for i in range(20):
        p, _ = Person.objects.get_or_create(name=f"Titan Worker {i}", center=center, contractor=c2, is_company_staff=False)
        people.append(p)

    start_date = date(2026, 2, 1)
    for i in range(28):
        current_date = start_date + timedelta(days=i)
        record = DailyRecord.objects.create(
            center=center, date=current_date,
            day_production_kgs=random.randint(4000, 6000), night_production_kgs=random.randint(3500, 5500)
        )
        daily_workers = random.sample(people, k=random.randint(20, 35))
        for idx, person in enumerate(daily_workers):
            shift = 'Day' if idx % 2 == 0 else 'Night'
            AttendanceEntry.objects.create(record=record, person=person, shift=shift)

    return JsonResponse({'status': 'success', 'message': 'Generated 28 days of data for Feb 2026!'})

@login_required
@require_POST
def nuke_dummy_data(request):
    DailyRecord.objects.all().delete()
    Person.objects.all().delete()
    Contractor.objects.all().delete()
    return JsonResponse({'status': 'success', 'message': 'Manpower data wiped clean.'})

# --- 8. CENTER ANALYTICS HUB ---
@login_required
def centers_hub(request):
    centers = Center.objects.annotate(total_records=Count('dailyrecord')).order_by('name')
    return render(request, 'manpower/centers.html', {'centers': centers})

@login_required
def api_center_analytics(request, center_id):
    try:
        now = datetime.now()
        year = int(request.GET.get('year', now.year))
        month = int(request.GET.get('month', now.month))
        shift_filter = request.GET.get('shift', 'Both') # 'Day', 'Night', or 'Both'

        center = Center.objects.get(id=center_id)
        records = DailyRecord.objects.filter(center=center, date__year=year, date__month=month).order_by('date')

        chart_data = []
        total_prod = 0
        total_headcount = 0
        days_active = 0

        num_days = calendar.monthrange(year, month)[1]
        record_dict = {r.date.strftime('%Y-%m-%d'): r for r in records}

        for day in range(1, num_days + 1):
            date_str = f"{year}-{month:02d}-{day:02d}"
            record = record_dict.get(date_str)

            daily_prod = 0
            daily_headcount = 0

            if record:
                if shift_filter == 'Both':
                    daily_prod = float(record.day_production_kgs) + float(record.night_production_kgs)
                    daily_headcount = record.entries.values('person').distinct().count()
                elif shift_filter == 'Day':
                    daily_prod = float(record.day_production_kgs)
                    daily_headcount = record.entries.filter(shift='Day').values('person').distinct().count()
                elif shift_filter == 'Night':
                    daily_prod = float(record.night_production_kgs)
                    daily_headcount = record.entries.filter(shift='Night').values('person').distinct().count()

                total_prod += daily_prod
                total_headcount += daily_headcount
                if daily_prod > 0 or daily_headcount > 0:
                    days_active += 1

            chart_data.append({
                'day': day,
                'date': date_str,
                'production': daily_prod,
                'headcount': daily_headcount
            })

        avg_headcount = round(total_headcount / days_active) if days_active > 0 else 0
        efficiency = round(total_prod / total_headcount, 2) if total_headcount > 0 else 0

        return JsonResponse({
            'status': 'success',
            'center_name': center.name,
            'chart_data': chart_data,
            'kpis': {
                'total_production': total_prod,
                'avg_headcount': avg_headcount,
                'efficiency': efficiency
            }
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})