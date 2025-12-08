#!/bin/bash

# Configuration des chemins
BASE_PATH="/home/ubuntu/falcon_camera_udp_workers/stockage/ftp_storage"
CAMERA_PATH="${BASE_PATH}/share/HG0438PAZ00098"
IA_PATH="${BASE_PATH}/IA"

# Limites de stockage (en Go)
CAMERA_LIMIT=50
IA_LIMIT=10

# Fonction pour afficher les messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Fonction pour obtenir la taille d'un dossier en Go
get_size_gb() {
    local path=$1
    if [ -d "$path" ]; then
        du -sb "$path" 2>/dev/null | awk '{printf "%.2f", $1/1024/1024/1024}'
    else
        echo "0"
    fi
}

# Fonction pour supprimer les dossiers les plus anciens (FIFO) dans le path caméra
cleanup_camera_storage() {
    local current_size=$(get_size_gb "$CAMERA_PATH")
    log_message "Taille actuelle du stockage caméra: ${current_size} Go"
    
    if (( $(echo "$current_size > $CAMERA_LIMIT" | bc -l) )); then
        log_message "  ALERTE: Stockage caméra > ${CAMERA_LIMIT} Go. Début du nettoyage FIFO..."
        
        # Parcourir les dossiers de dates triés par ordre chronologique
        for date_dir in $(ls -1d "${CAMERA_PATH}"/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] 2>/dev/null | sort); do
            current_size=$(get_size_gb "$CAMERA_PATH")
            
            if (( $(echo "$current_size <= $CAMERA_LIMIT" | bc -l) )); then
                log_message " Taille réduite à ${current_size} Go. Nettoyage terminé."
                break
            fi
            
            # Supprimer les dossiers heures (00, 01, 02, etc.) dans l'ordre FIFO
            for hour_dir in $(ls -1d "${date_dir}"/[0-9][0-9][0-9] 2>/dev/null | sort); do
                current_size=$(get_size_gb "$CAMERA_PATH")
                
                if (( $(echo "$current_size <= $CAMERA_LIMIT" | bc -l) )); then
                    log_message " Taille réduite à ${current_size} Go. Nettoyage terminé."
                    break 2
                fi
                
                local hour_size=$(get_size_gb "$hour_dir")
                log_message "Suppression: $hour_dir (${hour_size} Go)"
                rm -rf "$hour_dir"
                
                # Supprimer le dossier date s'il est vide
                if [ -z "$(ls -A "$date_dir" 2>/dev/null)" ]; then
                    log_message "Suppression du dossier vide: $date_dir"
                    rm -rf "$date_dir"
                fi
            done
        done
    else
        log_message " Stockage caméra OK: ${current_size} Go / ${CAMERA_LIMIT} Go"
    fi
}

# Fonction pour supprimer les dossiers les plus anciens (FIFO) dans le path IA
cleanup_ia_storage() {
    local current_size=$(get_size_gb "$IA_PATH")
    log_message "Taille actuelle du stockage IA: ${current_size} Go"
    
    if (( $(echo "$current_size > $IA_LIMIT" | bc -l) )); then
        log_message "  ALERTE: Stockage IA > ${IA_LIMIT} Go. Début du nettoyage FIFO..."
        
        # Parcourir les dossiers de dates triés par ordre chronologique
        for date_dir in $(ls -1d "${IA_PATH}"/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] 2>/dev/null | sort); do
            current_size=$(get_size_gb "$IA_PATH")
            
            if (( $(echo "$current_size <= $IA_LIMIT" | bc -l) )); then
                log_message " Taille réduite à ${current_size} Go. Nettoyage terminé."
                break
            fi
            
            local date_size=$(get_size_gb "$date_dir")
            log_message "Suppression: $date_dir (${date_size} Go)"
            rm -rf "$date_dir"
        done
    else
        log_message " Stockage IA OK: ${current_size} Go / ${IA_LIMIT} Go"
    fi
}

# Fonction principale
main() {
    log_message "========================================="
    log_message "Démarrage du contrôle de stockage"
    log_message "========================================="
    
    # Créer les dossiers s'ils n'existent pas
    mkdir -p "$CAMERA_PATH"
    mkdir -p "$IA_PATH"
    
    # Nettoyage du stockage caméra
    cleanup_camera_storage
    
    # Nettoyage du stockage IA
    cleanup_ia_storage
    
    log_message "========================================="
    log_message "Contrôle de stockage terminé"
    log_message "========================================="
    echo ""
}

# Boucle infinie avec exécution toutes les 10 minutes
while true; do
    main
    log_message " Attente de 10 minutes avant la prochaine vérification..."
    sleep 600  # 600 secondes = 10 minutes
done