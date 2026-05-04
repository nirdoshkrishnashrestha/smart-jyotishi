def get_navamsha(longitude):
    rashi_idx = int(longitude / 30) % 12
    deg_in_rashi = longitude % 30
    element = rashi_idx % 4
    start_sign = [0, 9, 6, 3][element]
    nav_in_sign = int(deg_in_rashi / (30 / 9))
    navamsha_rashi_idx = (start_sign + nav_in_sign) % 12
    return navamsha_rashi_idx

print(get_navamsha(0)) # Aries -> 0
print(get_navamsha(60)) # Gemini -> 6
print(get_navamsha(120)) # Leo -> 0
print(get_navamsha(270)) # Capricorn (270) -> 9
