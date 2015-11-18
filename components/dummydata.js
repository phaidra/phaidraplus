define(function(){

return function dummydata() {

	return {

			pid:"",
			type:"Image",
			url:"",
			status:"",

			// Sprache digitales oder analoges Objekt?
			lang:"de",

			// Hinsichtlich mehrsprachiger Angaben gilt jeweils der erste Eintrag
			title:"",
			alttitle:"",
			subtitle:"",

			// Beschreibung
			desc:"",
			desc_language:"de",

			// Lebenszyklus - Beitrag - Werkschaffende/r
			author: {
					type:"Person",
					forename:"",
					surname:""
				},

			// Lebenszyklus - Beitrag
			roles: [
				{
					role:"",
					entity: {
						type:"institut",
						name:"Univie"
						}
					}
				],

			// Erstellungsdatum
			upload_date: new Date(), // oder Timestamp

			// Objektdatum, sind historische Daten in Phaidra implementiert?
			//obj_date: new Date("Y-m-d"), // oder Timestamp

			// Technische Angaben - Dauer HH:MM:SS
			length:"",

			// Rechte & Lizenzen
			costs:"Nein",
			copyright:"",
			license:"Keine Lizenz",

			// Zuordnung - Institutionszugehörigkeit oder automatisch über Uploader-User-ID->Institutionszugehörigkeit
			datapool: {
					id:"A1",
					value:"Phaidra+",
					parent_ids:""
				},

			
			// Kontextuelle Angaben - GPS Daten
			/*latlon: {
				lat: 37.9667,
				lon: 23.7167
			},*/

			// Dateien
			file:"",
			//"https://fedora.phaidra.univie.ac.at/fedora/get/o:632/bdef:Content/get",
			preview: "",//"https://phaidra.univie.ac.at/preview/"+imagelist[Math.floor(Math.random()*imagelist.length)]+"/ImageManipulator/boxImage/960/jpg",
			//"https://phaidra.univie.ac.at/preview/o:632/ImageManipulator/boxImage/480/jpg",

			peer_reviewed:"Nein",

			// Wenn Collection: pids der Objekte
			members:[
				],



			/*
			*
			* Felder Priorität 2, kann nachträglich implementiert werden
			*
			*/

			// Klassifikation
			subject: [
				{
					source:"",
					taxon:[""]
					
					},
				],

			// Provenienz
			provenance: [
				// {
				// 	source:"Analoger Film",
				// 	desc:"",
				// 	role:"Archive",
				// 	entity: null,
				// 	date_from:"1976-01-01", // oder Timestamp
				// 	date_to:"2008-08-01", // oder Timestamp
				// 	location:"Vienna"
				// 	},
				],

			// Externe Identifier
			identifiers: [
				],


			// Kontextuelle Angaben - Abmessungen
			dimensions: {
					source:"",
					measurement:"",
					length:null,
					height:null
				},
	}
	
}



})


var imagelist = [
"o:19604",
"o:191697",
"o:189407",
"o:191719",
"o:188554",
"o:188822",
"o:191856",
"o:191701",
"o:188882",
"o:191811",
"o:19866",
"o:29573",
"o:29498",
"o:29535",
"o:189316",
"o:27910",
"o:29203",
"o:29419",
"o:31609",
"o:190302",
"o:189887",
"o:30666",
"o:191527",
"o:191637",
"o:190858",
"o:191610",
"o:191203",
"o:190794",
"o:188548",
"o:191177",
"o:104292",
"o:935",
"o:127605",
"o:127903",
"o:185649",
"o:188459",
"o:186224",
"o:186185",
"o:174795",
"o:127661",
"o:105324",
"o:104857",
"o:127671",
"o:127378",
"o:174464",
"o:128293",
"o:128321",
"o:155021",
"o:29201",
"o:174827",
"o:105769"];