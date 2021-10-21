import graphene

from app.schema.queries import Query

schema = graphene.Schema(query=Query)
