# Generated by Django 3.2.7 on 2021-12-29 14:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0009_gameleaderboarditem'),
    ]

    operations = [
        migrations.AlterField(
            model_name='resource',
            name='ingredients',
            field=models.ManyToManyField(to='app.Resource'),
        ),
    ]
