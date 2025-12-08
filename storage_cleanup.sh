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
    log_message " Taille actuelle du stockage caméra: ${current_size} Go / ${CAMERA_LIMIT} Go"
    
    if (( $(echo "$current_size > $CAMERA_LIMIT" | bc -l) )); then
        log_message "  ALERTE: Stockage caméra > ${CAMERA_LIMIT} Go"
        log_message "  Début du nettoyage FIFO (jour le plus ancien en premier)..."
        
        # Obtenir la liste des dossiers de dates triés (plus ancien en premier)
        local date_dirs=($(ls -1d "${CAMERA_PATH}"/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] 2>/dev/null | sort))
        
        if [ ${#date_dirs[@]} -eq 0 ]; then
            log_message " Aucun dossier de date trouvé"
            return
        fi
        
        log_message " Dossiers trouvés: ${date_dirs[@]##*/}"
        
        # Parcourir les dossiers de dates du plus ancien au plus récent
        for date_dir in "${date_dirs[@]}"; do
            current_size=$(get_size_gb "$CAMERA_PATH")
            
            # Si la taille est OK, arrêter
            if (( $(echo "$current_size <= $CAMERA_LIMIT" | bc -l) )); then
                log_message " Taille réduite à ${current_size} Go. Nettoyage terminé."
                return
            fi
            
            local date_name=$(basename "$date_dir")
            log_message " Traitement du jour: $date_name"
            
            # Le chemin fixe est 001/dav/ avant les heures
            local dav_path="$date_dir/001/dav"
            
            if [ ! -d "$dav_path" ]; then
                log_message "    Chemin $date_name/001/dav/ n'existe pas, passage au suivant"
                continue
            fi
            
            # Obtenir la liste des dossiers heures triés (plus ancien en premier)
            local hour_dirs=($(find "$dav_path" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort))
            
            if [ ${#hour_dirs[@]} -eq 0 ]; then
                log_message "    Pas de dossiers heures dans $date_name/001/dav/"
                continue
            fi
            
            log_message "   Dossiers heures trouvés: ${#hour_dirs[@]}"
            
            # Supprimer les dossiers heures un par un jusqu'à ce que la taille soit OK
            for hour_dir in "${hour_dirs[@]}"; do
                current_size=$(get_size_gb "$CAMERA_PATH")
                
                # Si la taille est OK, arrêter
                if (( $(echo "$current_size <= $CAMERA_LIMIT" | bc -l) )); then
                    log_message " Taille réduite à ${current_size} Go. Nettoyage terminé."
                    return
                fi
                
                local hour_name=$(basename "$hour_dir")
                local hour_size=$(get_size_gb "$hour_dir")
                log_message "    Suppression: $date_name/001/dav/$hour_name (${hour_size} Go)"
                rm -rf "$hour_dir"
                
                current_size=$(get_size_gb "$CAMERA_PATH")
                log_message "   Nouvelle taille: ${current_size} Go"
            done
            
            # Supprimer le dossier date entier s'il est vide après nettoyage
            if [ -z "$(find "$date_dir" -type f 2>/dev/null)" ]; then
                log_message "    Suppression du dossier complet (vide): $date_name"
                rm -rf "$date_dir"
            fi
        done
        
        current_size=$(get_size_gb "$CAMERA_PATH")
        log_message " Taille finale: ${current_size} Go"
    else
        log_message " Stockage caméra OK"
    fi
}

# Fonction pour supprimer les dossiers les plus anciens (FIFO) dans le path IA
cleanup_ia_storage() {
    local current_size=$(get_size_gb "$IA_PATH")
    log_message " Taille actuelle du stockage IA: ${current_size} Go / ${IA_LIMIT} Go"
    
    if (( $(echo "$current_size > $IA_LIMIT" | bc -l) )); then
        log_message "  ALERTE: Stockage IA > ${IA_LIMIT} Go"
        log_message "  Début du nettoyage FIFO..."
        
        # Parcourir les dossiers de dates triés par ordre chronologique (plus ancien en premier)
        for date_dir in $(ls -1d "${IA_PATH}"/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] 2>/dev/null | sort); do
            current_size=$(get_size_gb "$IA_PATH")
            
            if (( $(echo "$current_size <= $IA_LIMIT" | bc -l) )); then
                log_message " Taille réduite à ${current_size} Go. Nettoyage terminé."
                return
            fi
            
            local date_name=$(basename "$date_dir")
            local date_size=$(get_size_gb "$date_dir")
            log_message "  Suppression: $date_name (${date_size} Go)"
            rm -rf "$date_dir"
            
            current_size=$(get_size_gb "$IA_PATH")
            log_message " Nouvelle taille: ${current_size} Go"
        done
    else
        log_message " Stockage IA OK"
    fi
}

# Fonction principale
main() {
    log_message "========================================="
    log_message " Démarrage du contrôle de stockage"
    log_message "========================================="
    
    # Changer les permissions du dossier share et tous ses sous-dossiers
    log_message " Changement des permissions pour ${BASE_PATH}/share/..."
    sudo chown -R ubuntu:ubuntu "${BASE_PATH}/share/" 2>/dev/null
    sudo chmod -R 755 "${BASE_PATH}/share/" 2>/dev/null
    
    # Créer les dossiers s'ils n'existent pas
    mkdir -p "$CAMERA_PATH"
    mkdir -p "$IA_PATH"
    
    # Nettoyage du stockage caméra
    log_message ""
    log_message " === VÉRIFICATION STOCKAGE CAMÉRA ==="
    cleanup_camera_storage
    
    # Nettoyage du stockage IA
    log_message ""
    log_message " === VÉRIFICATION STOCKAGE IA ==="
    cleanup_ia_storage
    
    log_message ""
    log_message "========================================="
    log_message " Contrôle de stockage terminé"
    log_message "========================================="
}

# Boucle infinie avec exécution toutes les 10 minutes
while true; do
    main
    log_message ""
    log_message " Attente de 10 minutes avant la prochaine vérification..."
    log_message ""
    sleep 600  # 600 secondes = 10 minutes
done