from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0018_stocksheet_digit_confidence_data'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='stocksheet',
            name='digit_confidence_data',
        ),
    ]
