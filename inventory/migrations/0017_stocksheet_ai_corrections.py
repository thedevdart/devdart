from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0016_stocksheet_raw_extracted_data_notification_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='stocksheet',
            name='ai_corrections',
            field=models.JSONField(blank=True, help_text='Auto-tally digit corrections applied during supervisor upload', null=True),
        ),
    ]
