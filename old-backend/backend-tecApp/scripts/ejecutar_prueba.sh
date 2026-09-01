#!/bin/bash

set -e

echo "==== Deteniendo contenedores... ===="
sudo docker compose down

echo "==== Levantando contenedores ===="
sudo docker compose up --build 

echo "=== Esperando a que MySQL esté listo... ===="

until docker exec mysql-gestion mysqladmin ping -uroot -proot_pass --silent >/dev/null 2>&1
do
    sleep 2
done

echo "==== Insertando datos de prueba... ===="

docker exec -i mysql-gestion \
    mysql -uroot -proot_pass gestion_tecnica2 < scripts/prueba.sql

echo "==== Base de datos inicializada correctamente ===="
