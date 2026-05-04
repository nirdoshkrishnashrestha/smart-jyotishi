import nepali_datetime
from datetime import datetime

def convert_bs_to_ad(year: int, month: int, day: int) -> datetime:
    """
    Converts a Nepali Date (BS) to an English Date (AD).
    Returns a Python datetime object.
    """
    try:
        np_date = nepali_datetime.date(year, month, day)
        ad_date = np_date.to_datetime_date()
        return datetime.combine(ad_date, datetime.min.time())
    except ValueError as e:
        raise ValueError(f"Invalid Nepali date: {str(e)}")
