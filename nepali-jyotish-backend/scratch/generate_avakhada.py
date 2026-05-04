def test():
    YONIS = [
        "Ashwa", "Gaja", "Mesha", "Sarpa", "Sarpa", "Shvan", "Marjara", "Mesha", "Marjara",
        "Mushaka", "Mushaka", "Gau", "Mahisha", "Vyaghra", "Mahisha", "Vyaghra", "Mriga", "Mriga",
        "Shvan", "Vanara", "Nakula", "Vanara", "Simha", "Ashwa", "Simha", "Gau", "Gaja"
    ]
    # Gana logic
    GANAS = [""] * 27
    deva = [0, 4, 6, 7, 12, 14, 16, 21, 26]
    manushya = [1, 3, 5, 10, 11, 19, 20, 24, 25]
    rakshasa = [2, 8, 9, 13, 15, 17, 18, 22, 23]
    for i in deva: GANAS[i] = "Deva"
    for i in manushya: GANAS[i] = "Manushya"
    for i in rakshasa: GANAS[i] = "Rakshasa"
    
    # Nadi logic
    NADIS = [""] * 27
    for i in range(27):
        grp = i // 3
        pos = i % 3
        if grp % 2 == 0:
            NADIS[i] = ["Aadi", "Madhya", "Antya"][pos]
        else:
            NADIS[i] = ["Antya", "Madhya", "Aadi"][pos]
            
    print("YONIS =", YONIS)
    print("GANAS =", GANAS)
    print("NADIS =", NADIS)

test()
