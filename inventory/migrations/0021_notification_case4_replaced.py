from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0020_notification_snapshot_fields'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notification',
            name='notif_type',
            field=models.CharField(choices=[('case1', 'Success'), ('case2', 'Untallied'), ('case3', 'Review'), ('case2_resolved', 'Resolved'), ('case4', 'Replaced')], max_length=20),
        ),
    ]
