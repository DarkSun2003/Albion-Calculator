from django.db import models
from django.utils import timezone


class MarketPriceSnapshot(models.Model):
    """
    Stores verified market prices from AODP (spot + 24h traded history) and user/crowdsourced overrides.
    Works seamlessly with both SQLite (local PC development/offline use) and PostgreSQL (Railway production).
    """
    server = models.CharField(max_length=20, db_index=True, default='europe')
    item_id = models.CharField(max_length=120, db_index=True)
    city = models.CharField(max_length=50, db_index=True)
    quality = models.IntegerField(default=1, db_index=True)

    sell_price_min = models.BigIntegerField(default=0)
    buy_price_max = models.BigIntegerField(default=0)
    avg_price_24h = models.BigIntegerField(default=0)
    daily_volume = models.IntegerField(default=0)

    # 'aodp_live', 'aodp_history', 'user_override'
    source = models.CharField(max_length=30, default='aodp_live')
    aodp_updated_at = models.CharField(max_length=64, null=True, blank=True)
    recorded_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        unique_together = ('server', 'item_id', 'city', 'quality')
        indexes = [
            models.Index(fields=['server', 'item_id', 'city']),
        ]

    def __str__(self):
        return f"[{self.server}] {self.item_id} (Q{self.quality}) @ {self.city}: {self.sell_price_min}s"
