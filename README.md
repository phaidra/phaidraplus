
# phaidra+ readme

*phaidra+* <https://phaidra-plus.univie.ac.at> is a web-based interactive frontend to the Digital Asset Management System [phaidra](https://phaidra.univie.ac.at) developed at the University of Vienna.

###### In this document you will find
- A short description of the *phaidra+* software architecture
- Installation guide

* * *

## Software architecture

*phaidra+* consists of following layers:
- phaidra+ web application
- phaidra+ webservices
- Dedicated search server (Google Search Appliance)
- Digital Asset Management Systems that are indexed by the search server


* * *


### phaidra+ web application

- is a browser-based application exposing interactive tools for research, presentation and analysis of digital objects stored in connected repositories
- it is mostly based on the web technologies html5, javascript and css
- it is the **only component visible** to users in the software architecture of *phaidra+*
- other components such as PhaidraPlusBackend, Google Search Appliance or MongoDB provide server-side application logic which is discreetly accessed by the *phaidra+* web application

##### Security
- By default, no account information needs to be transmitted by users ('Public mode')
- When users decide to log in to the application, account data is validated through *phaidra+ webservices* and replaced with an encrypted TOKEN for further authenticated communication with the webservices
- User account information is never saved nor stored in either the web application or on the *phaidra+* server

##### Input/Output
- *phaidra+ webservices* are accessed for retrieval and storage of user-related data created with *phaidra+*
- GSA is accessed when performing a search, using a predefined metadata structure for advanced queries on specific metadata fields
- Resultset returned by GSA is displayed in the *phaidra+* web application
- Any user interaction related to individual folders in "Logged-In" mode is automatically saved
- Direct download of digital objects including download options for different image sizes is enabled by proxying through nginx - nginx sets header 'content-disposition:attachment' when accessed at ```/*/download/``` (\* signifying a phaidra installation name - e.g. *phaidra-temp*)
- Powerpoint documents, containing up to 50 images of a users *phaidra+* folder, can be downloaded in "Logged-In" mode. 
    + *phaidra+* posts data containing corresponding information to ```./ppt.php```
    + images are downloaded using curl
    + ppt file is created and downloaded by client computer
    + This functionality is provided using the PHP library ```external/php/PHPPowerPoint/```  


***


### phaidra+ webservices <a id="PhaidraPlusBackend"></a>

The backend for *phaidra+* exposes a secure API for authentication and read/write access to relevant data sources.

##### Security
- Authentication mechanism validates against remote LDAP source 
- Session data managed by backend
- Client-server communication is validated with session TOKEN on each request
- Database operations tied to security mechanism
- Session timeout / keep-alive implemented by backend

##### Input/Output
- *CRUD* operations for *phaidra+* specific user-data (e.g. folders / presentations of individual user)
- API to directly access underlying repositories (e.g. objects stored in connected repositories)

*phaidra+ webservices* were created by Rastislav Hudak


* * *


### MongoDB

MongoDB is used as primary storage for *phaidra+* specific user-data.

##### Security
- MongoDB can only be accessed through authenticated and validated API calls provided by [*phaidra+ webservices*](#PhaidraPlusBackend)

##### Input/Output
- Database is accessed through *phaidra+ webservices*
- *phaidra+ webservices* connect to remote database

The database currently in use is deployed remotely at stage.phaidra.org.


* * *


### Google Search Appliance (GSA)

**GSA** is used as the primary search engine. The searchable index
covers all defined PHAIDRA deployments (currently *phaidra* & *phaidraTemp*) simultaneously.

##### Security
- Only read access is granted to *phaidra+*
- The GSA is accessed through a customized webservice provided at a specified endPoint (e.g. <https://phaidra-plus.univie.ac.at/google_search>)
- This address must implicitly be publicly accessible:
    + The *phaidra+* web application requests this adress in order to access the GSA index (e.g. perform a search)
- GSA resultsets provide all metadata information subsequently accessible and displayed by the *phaidra+ web application*
- URLs to digital objects (e.g. images) are included in resultset
- Access to digital objects is managed by the original repository - when accessing digital objects, security mechanisms of the original repository are in place

##### Input/Output
- The search engine is accessed at a specified endpoint defined in  by the *phaidra+ web application*
- requests to this address are passed on to Google Search Appliance
- The resultset is transformed to JSON format and delivered to the web application
- a maximum of 100 results are returned per request
- a maximum of 1000 results are returned per search query

If the metadata structure defined for *phaidra+* can be enforced or translated for other Digital Asset Management Systems - Google Search Appliance could be used to enable *phaidra+* users to research and use content of other relevant third party databases.

The endpoint is defined in ```config/gsa-request``` 


* * *


# Installation Guide

##### Requirements

Start from scratch with a new VM

* Ubuntu 14.04 
* 1 GB RAM
* 8 GB HD
* SSH access with sudo privileges

*other operating systems can be considered, if installation and configuration of required software is possible.*

#### Upgrade system

Update and ugrade system
``` sh
    apt-get update && apt-get upgrade
```

**Install requirements**
``` sh
        apt-get install \
            openssl libpcre3 libpcre3-dev gzip wget \
            git-core curl python-software-properties \
            build-essential libgd2-xpm-dev
```


***

###  Install phaidra+ web application

``` sh
# create folder structure and grant access to user www-data
mkdir -p /srv/www
cd /srv
chown www-data:www-data . -R
# phaidra+ will reside here
cd /srv/www
# clone phaidra+ git repo
git clone https://bitbucket.org/phaidraplus/phaidraplus
```

The *phaidra+* web application will be located at ```/srv/www/phaidraplus```


***


### Webserver setup
This setup is using nginx and php5-fpm to handle HTTP requests 
Alternative webserver environments may be used, if the configuration of your environment can be adjusted to accomodate functionality defined in the provided nginx and php configuration which can be found here: ```config/etc```

#### Uninstall apache
``` sh
    killall -9 apache2
    apt-get remove apache2
```

#### Install nginx

``` sh
    add-apt-repository ppa:nginx/stable
    apt-get update
    apt-get install nginx-full
    # Stop nginx for now
    service nginx stop
``` 

**Install SSL certificates**
For HTTPS a valid SSL certificate must be installed.
How-To: <http://nginx.org/en/docs/http/configuring_https_servers.html>


#### Install PHP

``` sh
    sudo add-apt-repository ppa:ondrej/php5
    apt-get update
    apt-get -y install php5-fpm php5-mcrypt php5-cli php5-curl php5-json
    # Stop php-fpm for now
    service php-fpm stop
```

#### Install configuration files

configuration files are provided for nginx and php at `config/etc/nginx/conf` and `config/etc/php5`

``` sh
    mv /etc/nginx /etc/nginx.original
    ln -s /srv/www/phaidraplus/config/nginx /etc/
    mv /etc/php5 /etc/php5.original
    ln -s /srv/www/phaidraplus/config/php5 /etc/
    # Create additional nginx directories
    mkdir -p /srv/cache
    mkdir -p /srv/temp
    chown www-data:www-data /srv -R
```

#### Start nginx & php-fpm
    service php5-fpm start && service nginx start

***

## Install phaidra+ webservices
### Überarbeitung durch Rasta benötigt
**Install requirements**
``` sh
    Information Rasta
```

**Install webservice application**
``` sh
    cd /srv/www
    git clone https://bitbucket.org/phaidraplus/phaidra-plus-backend
    cd phaidra-plus-backend
    mkdir -p /etc/phaidra
    ln -s PhaidraPlusBackend.json /etc/phaidra/
```
**Start webservices**
``` sh
    Information Rasta
```

***

## Done
Access phaidra+ at your chosen domain


***


# phaidra+ data structures
Google Search appliance or intermediary service must be setup to deliver data formatted as JSON. Following structure is used to describe a single digital object:

```sh
{
        pid:"o:30",
        type:"Image",
        url:"https://phaidra.univie.ac.at/o:30",
        status:"",
        lang:"de",
        title:"Titel",
        title_language:"de",
        alttitle:"",
        subtitle:"",
        desc:"Beschreibung",
        desc_language:"de",
        # Lebenszyklus - Beitrag - Werkschaffende/r
        author: {
                type:"Person",
                forename:"",
                surname:""
            },
        # Lebenszyklus - Beitrag
        roles: [
            {
                role:"Repository",
                entity: {
                    type:"institut",
                    name:"Universität Wien"
                    }
                }
            ],
        # Erstellungsdatum
        upload_date: <timestamp>,
        # Objektdatum
        obj_date: <timestamp>,
        # Technische Angaben - Dauer hh:mm:ss
        length:"",
        # Rechte & Lizenzen
        costs:"Nein",
        copyright:"",
        license:"Keine Lizenz",
        # Zuordnung Datenbestand
        datapool: {
                id:"A1",
                value:"Phaidra+",
                parent_ids:""
            },
        # Kontextuelle Angaben - Location
        latlon: {
            lat: 37.9667,
            lon: 23.7167
        },
        # Dateien & Vorschaubilder
        file:"https://fedora.phaidra.univie.ac.at/fedora/get/o:632/bdef:Content/get",
        preview: "https://phaidra.univie.ac.at/preview/o:30/ImageManipulator/boxImage/960/jpg",
        # Additional info
        peer_reviewed:"Nein",
        # Wenn Collection: pids der Objekte
        members:[
            ],
        # Klassifikation
        subject: [
            {
                source:"",
                taxon:[""]
                },
            ],
        # Provenienz
        provenance: [
             {
              source:"Analoger Film",
              desc:"",
              role:"Archive",
              entity: null,
              date_from:"1976-01-01", // oder Timestamp
              date_to:"2008-08-01", // oder Timestamp
              location:"Vienna"
              },
            ],
        # Externe Identifier
        identifiers: [
            ],
        # Kontextuelle Angaben - Abmessungen
        dimensions: {
                source:"",
                measurement:"",
                length:null,
                height:null
            },
}
```


### Version
0.9.0
 

License
----

MIT

