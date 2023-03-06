# Setup a Development Server on Digital Ocean
1. Start up a new Digital Ocean Droplet (use Marketplace Droplet: MySQL droplet [it already has MySQL pre-installed, please trust me]). You'll need at least 2 GB of RAM to build the React site on the server. The steps below were tested using Ubuntu 20.04.
2. After that, go to your Digital Ocean dashboard and on the left sidebar click **Networking**. Click on the **Firewall** tab and create a firewall. Your firewall should looks like this: ![](readme_images/Droplet_Firewall.png)
3. As the root user, run:
```
apt update
apt upgrade
```
4. Upload the `schema.sql` file to the droplet.
5. Run `mysql`, then in the MySQL command prompt run:
```sql
CREATE DATABASE elle_database;
USE elle_database;
source schema.sql;
CREATE USER 'elle'@'localhost' IDENTIFIED BY 'INSERT_PASSWORD';
GRANT INSERT, UPDATE, DELETE, SELECT ON elle_database.* TO 'elle'@'localhost';
```
  * Ensure the permissions were granted to the new user by running `SHOW GRANTS for 'elle'@'localhost';`
  * You can now login to phpMyAdmin using this user
    * The Digital Ocean droplet comes with phpmyadmin, you should be able to access it at [IP_ADDRESS]/phpmyadmin
6. Install a Redis database by running:
```
apt install redis-server
```
7. Edit the following line in `/etc/redis/redis.conf`:
```diff
-supervised no
+supervised systemd
```
8. Restart the Redis service, then verify that it's running with:
```
systemctl restart redis.service
systemctl status redis
```
  * If you encounter any problems installing it, refer to the guide I followed: https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-ubuntu-20-04
9. Run:
```
apt install nodejs npm
apt install python3
apt install python3-pip
```
10. Clone the GitHub repo: `git clone https://github.com/Naton-1/ELLE-2023-Website-API.git` into this directory: `/var/www/`
11. Go into `ELLE-2023-Website-API/` and create the following folders:
* `audios`
* `images`
* `deletes`
* `temp_uploads`
12. Then install the Python requirements:
```
pip3 install -r requirements.txt
```
13. Create a environment variable file in the same directory:
```
touch .env
```
14. Paste this content into the file, replacing "INSERT_PASSWORD" with the MySQL user password you created in step 4:
```
MYSQL_DATABASE_USER = 'elle'
MYSQL_DATABASE_PASSWORD = 'INSERT_PASSWORD'
MYSQL_DATABASE_DB = 'elle_database'
MYSQL_DATABASE_HOST = 'localhost'
SECRET_KEY = 'ian'
```
  * Note: What `SECRET_KEY` does is a mystery
15. Go to `ELLE-2023-Website-API/templates/public/` and create a htaccess file:
```
touch .htaccess
```
16. Paste this content into the file:
```
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```
17. Go to `ELLE-2023-Website-API/templates` then build the React website:
```
npm install
npm run build
```
18. Launch a new screen so you can keep the API running while doing other things inside the SSH session:
```
screen
```
19. Finally, to launch the API go into `ELLE-2023-Website-API/` then run
```
python3 __init__.py
```
20. Press `Ctrl + Alt + D` to get out of the screen while leaving the API running.
21. Now we need to configure an Apache site file so our site serves up the correct content. Go to `/etc/apache2/sites-available` and create a site file:
```
touch elle-flask-app.conf
```
22. Paste this content into the file:
```
<VirtualHost *:80>
    ServerName INSERT_YOUR_DROPLET'S_IP_ADDRESS
    DocumentRoot /var/www/ELLE-2023-Website-API/templates/build

    <Directory /var/www/ELLE-2023-Website-API/templates/build>
        Options FollowSymLinks MultiViews
        AllowOverride All
        Order allow,deny
        Allow from all
    </Directory>
    
    Alias /images /var/www/ELLE-2023-Website-API/images
    <Directory /var/www/ELLE-2023-Website-API/images>
        Order allow,deny
        Allow from all
    </Directory>
    
    Alias /images /var/www/ELLE-2023-Website-API/audios
    <Directory /var/www/ELLE-2023-Website-API/audios>
        Order allow,deny
        Allow from all
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/error.log
    LogLevel warn
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```
23. Activate `mod_rewrite` Apache feature to prevent unintentional React Router 404 pages:
```
a2enmod rewrite
```
24. Enable the site file:
```
a2ensite elle-flask-app
sudo systemctl reload apache2
```
25. Congrats, now the website is being hosted at [DROPLET_IP_ADDRESS] and the API is being hosted at [DROPLET_IP_ADDRESS:5050/elleapi].

## Troubleshooting
If you can't connect to the API, check that the Ubuntu firewall isn't blocking the API port (by default, port 5050) with:
```
ufw status
```