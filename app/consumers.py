import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.core.cache import cache

from app.models import GameChatMessage, GameChat


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.groups = set()
        self.chat_ids = dict()
        self.tab_id = None

    async def disconnect(self, code):
        for group in self.groups:
            await self.channel_layer.group_send(group, {
                'type': 'disconnected_evt',
                'user': self.address,
                'chat_id': self.chat_ids[group],
                'user_tab_id': self.tab_id,
            })
            await self.channel_layer.group_discard(group, self.channel_name)

    async def receive_json(self, msg, **kwargs):
        action = msg['action']

        if action == 'join_chat':
            chat_id = msg['chatId']
            token = msg['token']
            self.address = address = msg['address']
            self.tab_id = msg['tabId']
            cached_value = str(cache.get(f'chat_token:{token}'))
            # print(f'chat_token:{token}', cached_value, chat_id)
            if str(cache.get(f'chat_token:{token}')) == chat_id:  # token valid
                group_id = f'chat.{chat_id}'
                await self.channel_layer.group_add(group_id, self.channel_name)
                self.groups.add(group_id)
                self.chat_ids[group_id] = chat_id
                await self.channel_layer.group_send(group_id, {
                    'type': 'connected_evt',
                    'user': address,
                    'chat_id': chat_id,
                    'user_tab_id': self.tab_id,
                })
            else:
                await self.send_json({'action': 'error', 'message': 'invalid_token'})
        elif action == 'get_history':
            chat_id = msg['chatId']
            group_id = f'chat.{chat_id}'
            if group_id in self.groups:
                msgs = []
                for msg in await database_sync_to_async(list)(GameChatMessage.objects.filter(chat__chat_id=chat_id)):
                    msgs.append({
                        'id': msg.id,
                        'from': msg.author,
                        'text': msg.text,
                        'chatId': chat_id,
                    })
                await self.send_json({'action': 'history_messages', 'msgs': msgs})
            else:
                await self.send_json({'action': 'error', 'message': 'group_not_joined'})
        elif action == 'leave_chat':
            chat_id = msg['chatId']
            group_id = f'chat.{chat_id}'
            if group_id in self.groups:
                await self.channel_layer.group_send(group_id, {
                    'type': 'disconnected_evt',
                    'user': self.address,
                    'chat_id': chat_id,
                    'user_tab_id': self.tab_id,
                })
                await self.channel_layer.group_discard(group_id, self.channel_name)
                self.groups.remove(group_id)
            else:
                await self.send_json({'action': 'error', 'message': 'group_not_joined'})
        elif action == 'send_message':
            chat_id = msg['chatId']
            group_id = f'chat.{chat_id}'
            if group_id in self.groups:
                text = msg['text']
                chat = await database_sync_to_async(GameChat.objects.get)(chat_id=chat_id)
                msg = await database_sync_to_async(GameChatMessage.objects.create)(chat=chat, author=self.address, text=text)
                msg = {
                    'id': msg.id,
                    'from': self.address,
                    'text': text,
                    'chatId': chat_id,
                }
                await self.channel_layer.group_send(group_id, {'type': 'new_message_evt', 'msg': msg})
            else:
                await self.send_json({'action': 'error', 'message': 'group_not_joined'})

    async def connected_evt(self, event):
        await self.send_json({
            'action': 'connected',
            'chatId': event['chat_id'],
            'user': event['user'],
            'userTabId': event['user_tab_id'],
        })

    async def disconnected_evt(self, event):
        await self.send_json({
            'action': 'disconnected',
            'chatId': event['chat_id'],
            'user': event['user'],
            'userTabId': event['user_tab_id'],
        })

    async def new_message_evt(self, event):
        await self.send_json({'action': 'new_messages', 'msgs': [event['msg']]})

    async def send_json(self, content, close=False):
        content['tabId'] = self.tab_id
        return await super().send_json(content, close)
