from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0013_remove_targetreportcolumn_center_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='CenterUploadToken',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token', models.CharField(db_index=True, max_length=64, unique=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('rotated_at', models.DateTimeField(blank=True, null=True)),
                ('last_used_at', models.DateTimeField(blank=True, null=True)),
                ('center', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='upload_token', to='inventory.center')),
            ],
        ),
        migrations.AddField(
            model_name='stocksheet',
            name='uploaded_by_source',
            field=models.CharField(choices=[('admin', 'Admin'), ('supervisor', 'Supervisor')], db_index=True, default='admin', max_length=20),
        ),
        migrations.AddField(
            model_name='stocksheet',
            name='uploaded_by_token',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='uploaded_sheets', to='inventory.centeruploadtoken'),
        ),
    ]
