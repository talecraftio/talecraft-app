# Generated by Django 3.2.7 on 2021-11-19 13:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0002_marketplacelisting_closed_at'),
    ]

    operations = [
        migrations.AlterField(
            model_name='marketplacelisting',
            name='price',
            field=models.DecimalField(decimal_places=0, max_digits=128),
        ),
    ]
