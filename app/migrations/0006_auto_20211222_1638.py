# Generated by Django 3.2.7 on 2021-12-22 13:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0005_leaderboarditem'),
    ]

    operations = [
        migrations.AddField(
            model_name='leaderboarditem',
            name='tier0',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='leaderboarditem',
            name='tier1',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='leaderboarditem',
            name='tier2',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='leaderboarditem',
            name='tier3',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='leaderboarditem',
            name='tier4',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='leaderboarditem',
            name='tier5',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
