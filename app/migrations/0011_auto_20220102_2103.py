# Generated by Django 3.2.7 on 2022-01-02 18:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0010_alter_resource_ingredients'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='resource',
            name='ingredients',
        ),
        migrations.AddField(
            model_name='resource',
            name='ingredients',
            field=models.JSONField(default=list),
        ),
    ]
