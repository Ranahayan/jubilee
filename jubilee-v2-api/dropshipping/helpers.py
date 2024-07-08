import re
from itertools import islice
from dropshipping.constants import DYNAMIC_MULTIPLIERS

def sanitize_sku(sku: str) -> str:
    return re.sub(r'[^a-zA-Z0-9\-_.]', '', sku)

def cents_to_string(cents):
    if cents is None:
        return "0.00"

    amount = cents / 100
    return "{:.2f}".format(amount)

def cents_to_real(cents):
    return f"${cents_to_string(cents)}"


def batched(iterable, n):
    """
    Batch data into tuples of length n. The last batch may be shorter.
    https://docs.python.org/3.11/library/itertools.html
    batched('ABCDEFG', 3) ---> ABC DEF G
  """
    if n < 1:
        raise ValueError('n must be at least one')
    it = iter(iterable)
    while batch := tuple(islice(it, n)):
        yield batch

def get_dynamic_multiplier(price_cents):
    for threshold, multiplier in DYNAMIC_MULTIPLIERS:
        if price_cents <= threshold:
            return multiplier
    return 1.4

def apply_dynamic_pricing(price_cents):
    multiplier = get_dynamic_multiplier(price_cents)
    calculated_price = int(price_cents * multiplier)
    return apply_99_cents_strategy(calculated_price)


def apply_99_cents_strategy(price_cents):
    if price_cents is None or price_cents <= 0:
        return 99
    dollars = price_cents // 100
    return (dollars * 100) + 99