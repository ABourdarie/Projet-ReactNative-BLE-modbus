import React, { Component } from 'react';

import {
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import RNHTMLtoPDF from 'react-native-html-to-pdf';

function Alerte(nomDeCapt, dateDebut, heureDebut, dateFin, heureFin, dateAquitt, heureAquitt) {
  this.nomDeCapt = nomDeCapt;
  this.dateDebut = dateDebut;
  this.heureDebut = heureDebut;
  this.dateFin = dateFin;
  this.heureFin = heureFin;
  this.dateAquitt = dateAquitt;
  this.heureAquitt = heureAquitt;
}

var alertesLideCuisine = [
  new Alerte('Cuisine Fromages','31/01/22','14H09','31/01/22','14h35','31/01/22','14h35'),
  new Alerte('Surgelé2','31/01/22','14H09','31/01/22','14h35','31/01/22','14h35'),
  new Alerte('Réfrégirateur','31/01/22','14H09','31/01/22','14h35','31/01/22','14h35'),
]
var alertesLideCave = [
  new Alerte('Vins','31/01/22','14H09','31/01/22','14h35','31/01/22','14h35'),
  new Alerte('Fromages','31/01/22','14H09','31/01/22','14h35','31/01/22','14h35'),
  new Alerte('Réfrégirateur','31/01/22','14H09','31/01/22','14h35','31/01/22','14h35'),
]
var alertesLideChambrefroide = [
  new Alerte('Surgelé1','31/01/22','14H09','31/01/22','14h35','31/01/22','14h35'),
  new Alerte('Surgelé2','31/01/22','14H09','31/01/22','14h35','31/01/22','14h35'),
  new Alerte('Réfrégirateur','31/01/22','14H09','31/01/22','14h35','31/01/22','14h35'),
]

function Lide(nom, tableauAlertes) {
  this.nom = nom;
  this.tableauAlertes = tableauAlertes;
}

var tableauLides = [
  new Lide('Cuisine', alertesLideCuisine),
  new Lide('Cave', alertesLideCave),
  new Lide('Chambre froide',alertesLideChambrefroide),
]

var fichier;


const generateHTML = value => (
`<h1>Alarmes</h1>

  <style>
    td {
      text-align: center;
    }

    th{
        color: cyan;
        border-bottom: 2px cyan solid;
    }
    </style>`);

    fichier = generateHTML();

    tableauLides.forEach(lide => {
      fichier += (
      `<h2>${lide.nom}</h2>
      <table style="width:100%">
          <tr>
            <th>Local</th>
            <th>Debut</th>
            <th>Fin</th>
            <th>Acquitt</th>
          </tr>
          `)
        lide.tableauAlertes.forEach(alerte => {
          fichier += (
          `
          <tr>
            <td>${alerte.nomDeCapt}</td>
            <td>${alerte.dateDebut} <br> ${alerte.heureDebut}</td>
            <td>${alerte.dateFin} <br> ${alerte.heureFin}</td>
            <td>${alerte.dateAquitt} <br> ${alerte.heureAquitt}</td>
          </tr>
          `)
        })
    fichier += '</table>'
  });
export default class HTMLtoPDF extends Component {
  async createPDF() {
    let options = {
      html: fichier,
      fileName: 'test',
      directory: 'Documents',
      base64: false,
    };

    let file = await RNHTMLtoPDF.convert(options)
    // console.log(file.filePath);
    alert(file.filePath);
  }

  render() {
    return(
      <View>
        <TouchableHighlight onPress={this.createPDF}>
          <Text>Create PDF</Text>
        </TouchableHighlight>
      </View>
    )
  }
}