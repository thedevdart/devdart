from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0019_remove_stocksheet_digit_confidence_data'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='snapshot_ai_corrections',
            field=models.JSONField(blank=True, help_text='AI corrections at upload time for Check Original', null=True),
        ),
        migrations.AddField(
            model_name='notification',
            name='snapshot_center_id',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='notification',
            name='snapshot_center_name',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        migrations.AddField(
            model_name='notification',
            name='snapshot_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='notification',
            name='snapshot_image_path',
            field=models.CharField(blank=True, default='', max_length=500),
        ),
        migrations.AddField(
            model_name='notification',
            name='snapshot_raw_extracted_data',
            field=models.JSONField(blank=True, help_text='Gemini extraction at upload time for Check Original', null=True),
        ),
        migrations.AlterField(
            model_name='notification',
            name='notif_type',
            field=models.CharField(choices=[('case1', 'Success'), ('case2', 'Untallied'), ('case3', 'Review'), ('case2_resolved', 'Resolved')], max_length=20),
        ),
    ]
