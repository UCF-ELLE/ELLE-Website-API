# Setup a Development Server on Digital Ocean

1. Start up a new Digital Ocean Droplet (use a Marketplace Droplet with MySQL bundled in, otherwise you'll have to install the MySQL client and server, steps not provided). You'll need at least 2 GB of RAM to build the React site on the server. The steps below were tested using Ubuntu 22.04.
2. After that, go to your Digital Ocean dashboard and on the left sidebar click **Networking**. Click on the **Firewall** tab and create a firewall. Your firewall should have ports open, at the very minimum, for 22, 80, 443, 5050 (range 5000-5050), and 3000.
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

- Ensure the permissions were granted to the new user by running `SHOW GRANTS for 'elle'@'localhost';`
- If you used a droplet with MySQL and phpmyadmin bundled in, you can now login to phpMyAdmin using this user.
  - You should be able to access it at [IP_ADDRESS]/phpmyadmin

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
service redis restart
systemctl redis status
```

- If you encounter any problems installing it, refer to the [guide that was followed](https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-redis-on-ubuntu-20-04) in 2023.

- You can also try running the following commands if the above doesn't work:

```
sudo systemctl restart redis.service
sudo systemctl status redis
```

9. Run:

```
apt install nodejs npm
apt-get install software-properties-common
add-apt-repository ppa:deadsnakes/ppa
apt-get update
apt-get install python3.11
```

- Ensure that your version of node is at least >= v20.11.0. Check with the command `node -v` and if necessary, update node using `sudo n latest`.

10. Clone the GitHub repo: `git clone https://github.com/UCF-ELLE/ELLE-Website-API.git`. (It doesn't matter what directory you clone into, but old static file servers typically host at `/var/www/`. The production site hosts from the `/home/elle` directory, so don't be opposed to cloning into your home directory.)
11. Then install the Python requirements, and ensure that you are in the correct directory when doing so:

```
pip3 install -r requirements.txt
```

Ensure that the API runs by running `python3 __init__.py`. If you see a Flask development server log pop up, exit it.

12. Create a environment variable file in the same directory:

```
touch .env
```

13. Paste this content into the file, replacing "INSERT_PASSWORD" with the MySQL user password you created in step 4:

```
MYSQL_DATABASE_USER = 'elle'
MYSQL_DATABASE_PASSWORD = 'INSERT_PASSWORD'
MYSQL_DATABASE_DB = 'elle_database'
MYSQL_DATABASE_HOST = 'localhost'
SECRET_KEY = 'ian'
```

- Note: What `SECRET_KEY` does is a mystery

14. Go to `ELLE-Website-API/templates` then build the React website:

```
npm install
npm run build
```

Just like with the API, ensure that the website runs by running `npm run start`. If you see a Next.JS server log pop up, exit it.

15. Now we need to configure an Apache site file so our site serves up the correct content. Go to `/etc/apache2/sites-available` and create a site file:

```
touch elle.conf
```

16. Paste this content into the file:

```apache
<VirtualHost *:80>
    ServerName INSERT_YOUR_DROPLET'S_IP_ADDRESS
    DocumentRoot /var/www/html

    <Location /elle>
      ProxyPass http://0.0.0.0:3000/elle
      ProxyPassReverse http://0.0.0.0:3000/elle
    </Location>

    <Location /elleapi>
      ProxyPass http://0.0.0.0:5050/elleapi
      ProxyPassReverse http://0.0.0.0:5050/elleapi
    </Location>

    ProxyPreserveHost On
    ProxyRequests Off
</VirtualHost>
```

17. Activate the `mod_proxy` Apache features to set up a proxy from the Flask/Next.JS servers to the `/elle` and `/elleapi` paths.

```
a2enmod proxy
a2enmod proxy_http
```

18. Enable the site file:

```
a2ensite elle
sudo service apache2 restart
```

19. Go to `ELLE-Website-API/templates` and install PM2, a process manager to keep your website and API running.

```
npm install pm2 -g
```

20. To get the server running using PM2, run the following command:

```
pm2 start "npm run start" --name elle_website
```

A PM2 process list should show up with `elle_website` as the only process. If you run `pm2 status`, you should see `elle_website`'s status as "online".

21. To get the API running using PM2, head back to the root directory (one directory up) and run the following command.

```
pm2 start "python3 __init__.py" --name elle_api
```

Be sure to check the status of `elle_api` with `pm2 status` to ensure the API is still running after starting.

22. Congrats, now the website is being hosted at [DROPLET_IP_ADDRESS/elle] and the API is being hosted at [DROPLET_IP_ADDRESS/elleapi].

## Troubleshooting

If you can't connect to the API, check that the Ubuntu firewall isn't blocking the API port (by default, port 5050) with:

```
ufw status
```
