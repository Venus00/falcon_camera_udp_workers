import socket

# ⚠️ MODIFIER CETTE LIGNE AVEC L'IP DU SERVEUR
SERVER_IP = "localhost"
UDP_PORT = 5012


def calculate_checksum(data):
    """
    Calcule le checksum simple (somme sans header ni checksum)
    Checksum = (Byte2 + Byte3 + Byte4 + ... + ByteN) & 0xFF

    Args:
        data: bytes des données (sans le checksum final)

    Returns:
        int: Checksum (1 byte)
    """
    # Somme de tous les bytes sauf le premier (header 0xFB)
    checksum = sum(data[1:]) & 0xFF
    return checksum


def parse_data(data, addr):
    if len(data) < 3:  # Header + Nb objets + Checksum (1 byte)
        return

    print(f"\n{'='*60}")
    print(f"📡 PAQUET REÇU DE {addr[0]}:{addr[1]}")
    print(f"{'='*60}")

    # Vérifier Checksum (1 byte)
    received_checksum = data[-1]
    calculated_checksum = calculate_checksum(data[:-1])

    # Parser
    header = data[0]
    nb_objects = data[1]

    print(f"Header: 0x{header:02X}")
    print(f"Nombre d'objets: {nb_objects}")
    print(f"Taille totale: {len(data)} bytes")
    print(f"Données brutes: {' '.join(f'{b:02X}' for b in data)}")

    print(f"\n{'─'*60}")
    print(f"🔐 VALIDATION CHECKSUM")
    print(f"{'─'*60}")
    print(f"Checksum reçu:     0x{received_checksum:02X}")
    print(f"Checksum calculé:  0x{calculated_checksum:02X}")

    if received_checksum == calculated_checksum:
        print(f"✅ CHECKSUM VALIDE - Trame intègre")
    else:
        print(f"❌ CHECKSUM INVALIDE - Trame corrompue!")
        print(f"⚠️  Parsing annulé")
        print("=" * 60 + "\n")
        return

    print(f"\n{'─'*60}")
    print(f"📦 OBJETS DÉTECTÉS")
    print(f"{'─'*60}")

    offset = 2
    for i in range(nb_objects):
        # Format: CLS(1) + ID(1) + X1(2) + X2(2) + Y1(2) + Y2(2) + Z(4) = 14 bytes
        # -1 pour exclure le Checksum (1 byte)
        if offset + 14 > len(data) - 1:
            break

        cls = data[offset]
        id_track = data[offset + 1]

        # Lire X1, X2, Y1, Y2 en big-endian (2 bytes chacun)
        x1 = (data[offset + 2] << 8) | data[offset + 3]
        x2 = (data[offset + 4] << 8) | data[offset + 5]
        y1 = (data[offset + 6] << 8) | data[offset + 7]
        y2 = (data[offset + 8] << 8) | data[offset + 9]

        # Lire Z en big-endian (4 bytes)
        z = (
            (data[offset + 10] << 24)
            | (data[offset + 11] << 16)
            | (data[offset + 12] << 8)
            | data[offset + 13]
        )

        # Reconstruire X et Y à partir de X1, X2, Y1, Y2
        x = (x1 << 16) | x2  # X = X1 (high 16 bits) + X2 (low 16 bits)
        y = (y1 << 16) | y2  # Y = Y1 (high 16 bits) + Y2 (low 16 bits)

        print(f"\n📍 Objet {i+1}:")
        print(f"   CLS:      0x{cls:02X} ({cls})")
        print(f"   ID_TRACK: 0x{id_track:02X} ({id_track})")
        print(f"   X1:       0x{x1:04X} ({x1})")
        print(f"   X2:       0x{x2:04X} ({x2})")
        print(f"   X:        0x{x:08X} ({x})  [X1<<16 | X2]")
        print(f"   Y1:       0x{y1:04X} ({y1})")
        print(f"   Y2:       0x{y2:04X} ({y2})")
        print(f"   Y:        0x{y:08X} ({y})  [Y1<<16 | Y2]")
        print(f"   Z:        0x{z:08X} ({z})")

        offset += 14

    print("\n" + "=" * 60 + "\n")


# Créer socket
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind(("0.0.0.0", 0))

print("=" * 60)
print("🎧 CLIENT UDP DÉMARRÉ")
print("=" * 60)
print(f"🖥️  Serveur cible: {SERVER_IP}:{UDP_PORT}")
print(f"🔐 Validation Checksum simple activée (somme sans header)")
print(f"📊 Format: X1(2B) + X2(2B) + Y1(2B) + Y2(2B) + Z(4B)")
print("=" * 60)

# S'enregistrer auprès du serveur
server_address = (SERVER_IP, UDP_PORT)
sock.sendto(b"HELLO", server_address)
print(f"\n✅ Enregistré auprès du serveur")
print("⏳ En attente de données...\n")
print("[Ctrl+C pour arrêter]\n")

try:
    while True:
        data, addr = sock.recvfrom(1024)
        parse_data(data, addr)

except KeyboardInterrupt:
    print("\n\n⛔ Arrêt du client...")
    sock.sendto(b"DISCONNECT", server_address)
    sock.close()
    print("✓ Socket fermé")
    print("👋 Au revoir!")
