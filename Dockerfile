# Etapa 1: Compilación de la app
FROM node:24-alpine AS build
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del código y compilar para producción
COPY . .
RUN npm run build -- --configuration=production

# Etapa 2: Servir la app con Nginx
FROM nginx:1.25-alpine

# Copiar los archivos compilados desde la etapa de build
COPY --from=build /app/dist/mi-proyecto-sakai/browser /usr/share/nginx/html

# Copiar una configuración básica de Nginx para soportar rutas de Angular (SPA)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]