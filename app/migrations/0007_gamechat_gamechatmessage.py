# Generated by Django 3.2.7 on 2021-12-24 10:46

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0006_auto_20211222_1638'),
    ]

    operations = [
        migrations.CreateModel(
            name='GameChat',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('chat_id', models.CharField(db_index=True, max_length=16)),
                ('player0', models.CharField(max_length=64)),
                ('player1', models.CharField(max_length=64)),
            ],
        ),
        migrations.CreateModel(
            name='GameChatMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('author', models.CharField(max_length=64)),
                ('datetime', models.DateTimeField(auto_now_add=True)),
                ('text', models.TextField()),
                ('chat', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='app.gamechat')),
            ],
        ),
    ]
