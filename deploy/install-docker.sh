#!/bin/bash
set -e
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
docker --version
docker compose version
