from redis.asyncio import Redis

redis = Redis(
    host = "redis",
    port = 6379,
    db = 0,

)