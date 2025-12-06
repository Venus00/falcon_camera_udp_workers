import socket

UDP_PORT = 5012  # même port que l'émetteur
BUFFER_SIZE = 1024


def calculate_crc16(data):
    """
    Calcule le CRC16 (CCITT) pour validation

    Args:
        data: bytes des données

    Returns:
        int: CRC16 (2 bytes)
    """
    crc = 0xFFFF
    polynomial = 0x1021

    for byte in data:
        crc ^= byte << 8
        for _ in range(8):
            if crc & 0x8000:
                crc = (crc << 1) ^ polynomial
            else:
                crc = crc << 1
            crc &= 0xFFFF

    return crc


def parse_and_validate(data, addr):
    """
    Parse et valide les données reçues avec CRC16

    Args:
        data: bytes reçus
        addr: adresse de l'émetteur
    """
    try:
        print("\n" + "=" * 60)
        print(f"📡 PAQUET REÇU DE {addr[0]}:{addr[1]}")
        print("=" * 60)

        if len(data) < 4:  # Header + Nb objets + CRC (2 bytes)
            print("❌ Paquet trop court")
            return

        # Extraction du CRC reçu (2 derniers bytes)
        received_crc = (data[-2] << 8) | data[-1]

        # Calcul du CRC sur les données sans les 2 derniers bytes
        calculated_crc = calculate_crc16(data[:-2])

        # Validation du CRC
        crc_valid = received_crc == calculated_crc

        # Header
        header = data[0]
        if header != 0xFB:
            print(f"⚠️  Header invalide: 0x{header:02X} (attendu: 0xFB)")
            return

        # Nombre d'objets
        nb_objects = data[1]

        print(f"Header: 0x{header:02X}")
        print(f"Nombre d'objets: {nb_objects}")
        print(f"Taille totale: {len(data)} bytes")
        print(f"Données brutes: {' '.join(f'{b:02X}' for b in data)}")

        print(f"\n{'─'*60}")
        print(f"🔐 VALIDATION CRC16")
        print(f"{'─'*60}")
        print(f"CRC reçu:     0x{received_crc:04X}")
        print(f"CRC calculé:  0x{calculated_crc:04X}")

        if crc_valid:
            print(f"✅ CRC VALIDE - Trame intègre")
        else:
            print(f"❌ CRC INVALIDE - Trame corrompue!")
            print(f"⚠️  Parsing annulé")
            print("=" * 60 + "\n")
            return

        # Parse chaque objet (2 + 4 + 4 + 4 = 14 bytes par objet)
        offset = 2
        objects = []

        print(f"\n{'─'*60}")
        print(f"📦 OBJETS DÉTECTÉS")
        print(f"{'─'*60}")

        for i in range(nb_objects):
            # -2 pour exclure le CRC
            if offset + 14 > len(data) - 2:
                print(f"⚠️  Objet {i+1}: données incomplètes")
                break

            cls = data[offset]
            id_track = data[offset + 1]

            # X (4 bytes big endian)
            x = (
                (data[offset + 2] << 24)
                | (data[offset + 3] << 16)
                | (data[offset + 4] << 8)
                | data[offset + 5]
            )

            # Y (4 bytes big endian)
            y = (
                (data[offset + 6] << 24)
                | (data[offset + 7] << 16)
                | (data[offset + 8] << 8)
                | data[offset + 9]
            )

            # Z (4 bytes big endian)
            z = (
                (data[offset + 10] << 24)
                | (data[offset + 11] << 16)
                | (data[offset + 12] << 8)
                | data[offset + 13]
            )

            obj = {"CLS": cls, "ID_TRACK": id_track, "X": x, "Y": y, "Z": z}
            objects.append(obj)

            print(f"\n📍 Objet {i+1}:")
            print(f"   CLS:      0x{cls:02X} ({cls})")
            print(f"   ID_TRACK: 0x{id_track:02X} ({id_track})")
            print(f"   X:        0x{x:08X} ({x})")
            print(f"   Y:        0x{y:08X} ({y})")
            print(f"   Z:        0x{z:08X} ({z})")

            offset += 14

        print("\n" + "=" * 60 + "\n")

        return {
            "header": header,
            "nb_objects": nb_objects,
            "crc_received": received_crc,
            "crc_calculated": calculated_crc,
            "crc_valid": crc_valid,
            "objects": objects,
        }

    except Exception as e:
        print(f"❌ Erreur lors du parsing: {e}")
        print("=" * 60 + "\n")
        return None


# Création du socket
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)

# Autoriser la réutilisation du port (plusieurs process)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

# Activer le mode broadcast
sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)

# Écoute sur toutes les interfaces
sock.bind(("", UDP_PORT))

print("=" * 60)
print("🎧 CLIENT UDP BROADCAST DÉMARRÉ")
print("=" * 60)
print(f"📡 Écoute sur toutes les interfaces, port {UDP_PORT}")
print(f"🔐 Validation CRC16 activée")
print(f"⏳ En attente de données...")
print("=" * 60)
print("\n[Ctrl+C pour arrêter]\n")

try:
    while True:
        data, addr = sock.recvfrom(BUFFER_SIZE)
        parse_and_validate(data, addr)

except KeyboardInterrupt:
    print("\n\n⛔ Arrêt du client...")
finally:
    sock.close()
    print("✓ Socket fermé")
