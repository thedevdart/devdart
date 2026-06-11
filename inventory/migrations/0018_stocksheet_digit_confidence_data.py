from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0017_stocksheet_ai_corrections'),
    ]

    operations = [
        migrations.AddField(
            model_name='stocksheet',
            name='digit_confidence_data',
            field=models.JSONField(blank=True, help_text='Temporary experiment: per-digit OCR confidence from Gemini', null=True),
        ),
    ]
