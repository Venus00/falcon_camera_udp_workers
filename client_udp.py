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
        # -1 pour exclure le Checksum (1 byte)
        if offset + 14 > len(data) - 1:
            break

        cls = data[offset]
        id_track = data[offset + 1]

        # Lire X, Y, Z en big-endian (4 bytes chacun)
        x = (
            (data[offset + 2] << 24)
            | (data[offset + 3] << 16)
            | (data[offset + 4] << 8)
            | data[offset + 5]
        )
        y = (
            (data[offset + 6] << 24)
            | (data[offset + 7] << 16)
            | (data[offset + 8] << 8)
            | data[offset + 9]
        )
        z = (
            (data[offset + 10] << 24)
            | (data[offset + 11] << 16)
            | (data[offset + 12] << 8)
            | data[offset + 13]
        )

        print(f"\n📍 Objet {i+1}:")
        print(f"   CLS:      0x{cls:02X} ({cls})")
        print(f"   ID_TRACK: 0x{id_track:02X} ({id_track})")
        print(f"   X:        0x{x:08X} ({x})")
        print(f"   Y:        0x{y:08X} ({y})")
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
