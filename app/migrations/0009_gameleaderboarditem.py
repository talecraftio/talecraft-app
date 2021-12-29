# Generated by Django 3.2.7 on 2021-12-28 11:59

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0008_auto_20211227_1816'),
    ]

    operations = [
        migrations.CreateModel(
            name='GameLeaderboardItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('league', models.PositiveSmallIntegerField()),
                ('address', models.CharField(max_length=64)),
                ('_played', models.PositiveIntegerField()),
                ('_wins', models.PositiveIntegerField()),
                ('_played_offset', models.PositiveIntegerField(default=0)),
                ('_wins_offset', models.PositiveIntegerField(default=0)),
            ],
        ),
    ]