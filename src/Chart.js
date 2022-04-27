import { Icon } from 'native-base';
import * as React from 'react';
import {useState} from 'react';
import { Button,View, StyleSheet,Image , StatusBar, SafeAreaView, ScrollView, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import ViewShot from "react-native-view-shot";
import { AreaChart, Grid, YAxis } from 'react-native-svg-charts'
import * as shape from 'd3-shape'
import base64 from 'react-native-base64';
import ImgToBase64 from 'react-native-image-base64';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import moment from 'moment'; 
import 'moment/locale/fr';

const NBDATE = 1440;
const NBDATE10 = 14400;
const NBDATE30 = 43200;

moment.locale('fr');

const dateDuJour = new Date();
const dateDuJourF = moment(dateDuJour).format("DD-MM-YYYY");

const nomDuLide = "Lide1 Limoges";

var pdfFinal = "";

const MyImage = <Image source={require('./../images/logo_facilide.png')} style={{ width: 64, height: 24 }}/>
const imgMicrolide = <Image source={require('./../images/logo_MICROLIDE.png')} style={{ width: 64, height: 24, alignSelf: 'flex-end' }}/>

  //On genere des valeurs pour les tests
 
  let DateDebut = new Date(2022,1,1,1,1,1);
  var DateActuelle = DateDebut;
  //La date de fin ne sera pas rentrée
  let DateDeFin = new Date(2022,2,1,23,59,59);

  let mesuresVoie1Cuisine = [];
  let mesuresVoie2Cuisine = [];
  let mesuresVoie1Cave = [];
  let mesuresVoie2Cave = [];

  function Mesure(valeur, date){
    this.valeur = valeur;
    this.date = date;
  }

  const plusOrMinus = () => {
    return Math.round(Math.random()) * 2 - 1;
  } 

  var lastValue = 0;
  
  const calculateTemp = () => {
    lastValue += plusOrMinus();
    return lastValue;
  }

  for (let index = 0; index < NBDATE30; index++) {
    DateActuelle = moment().add(60, 'seconds').format('hh:mm A');
    mesuresVoie1Cuisine.push(new Mesure(calculateTemp(),DateActuelle))
  };

  var lastValue = 0;
  var DateActuelle = DateDebut;

  for (let index = 0; index < NBDATE30; index++) {
    DateActuelle = moment().add(60, 'seconds').format('hh:mm A');
    mesuresVoie2Cuisine.push(new Mesure(calculateTemp(),DateActuelle))
  }

  var lastValue = 0;
  var DateActuelle = DateDebut;

  for (let index = 0; index < NBDATE30; index++) {
    DateActuelle = moment().add(60, 'seconds').format('hh:mm A');
    mesuresVoie1Cave.push(new Mesure(calculateTemp(),DateActuelle))
  }

  var lastValue = 0;
  var DateActuelle = DateDebut;

  for (let index = 0; index < NBDATE30; index++) {
    DateActuelle = moment().add(60, 'seconds').format('hh:mm A');
    mesuresVoie2Cave.push(new Mesure(calculateTemp(),DateActuelle))
  }
  
  
  //On fait une structure afin de simuler plusieurs lides/relevés
  function Lide(nom, tableauCapteur) {
    this.nom = nom;
    this.tableauCapteur = tableauCapteur;
  }

  function Capteur(nom, tableauValeurs){
    this.nom = nom;
    this.tableauValeurs = tableauValeurs;
  }
  
  var tableauCapteurCuisine = [
    new Capteur('Voie1Cuisine', mesuresVoie1Cuisine),
    new Capteur('Voie2Cuisine', mesuresVoie2Cuisine),
  ]
  
  var tableauCapteurCave = [
    new Capteur('Voie1Cave', mesuresVoie1Cave),
    new Capteur('Voie2Cave', mesuresVoie2Cave),
  ]
  var tableauLides = [
    new Lide('Cuisine', tableauCapteurCuisine),
    new Lide('Cave', tableauCapteurCave),
  ]

  
//Partie de test

console.log(tableauLides[0].tableauCapteur[0].tableauValeurs[0].valeur)
console.log(tableauLides[0].tableauCapteur[1].tableauValeurs[0].valeur)
console.log(tableauLides[1].tableauCapteur[0].tableauValeurs[0].valeur)
console.log(tableauLides[1].tableauCapteur[1].tableauValeurs[0].valeur)


    //Partie fonction du pdf
    
    async function createPDF(imagetopdf) {
      let options = {
        html: imagetopdf,
        fileName: 'testChart',
        directory: 'Documents',
        base64: false,
      };
    
      let file = await RNHTMLtoPDF.convert(options) 
      // console.log(file.filePath);
      alert(file.filePath);
      try {
        Share.open({title:'Graphs', url: "file://" + file.filePath , message: 'PDF de test' });
      } catch (err){
        console.log('Erreurs =>',err);
      }
      
    }



// Partie affichage des graphiques


const ChartView = () => {

  const viewShotRef = React.useRef();

  async function captureViewShot() {
    var hour = new Date();
    hour = moment(hour).format("hh:mm:ss");

    pdfFinal += `<div style="top:0; left:auto; right: 0; width:400px; height:200px; position: absolute; font-size: 25px">Export du : ${moment(DateDebut).format("DD-MM-YYYY")} à ${moment(DateDebut).format("hh:mm:ss")} 
    <br/> au ${moment(DateDeFin).format("DD-MM-YYYY")} à  ${moment(DateDeFin).format("hh:mm:ss")}</div>`;

    const imagebase64 = await viewShotRef.current.capture();
    pdfFinal += 
    `<img src=${imagebase64} alt="chart1"> 
    <br> `;
    pdfFinal += 
    `<br> 
    <P style="top:auto; left:0; right: auto; bottom:0; width:500px; height:20px; position: absolute; font-size: 25px;">fait le :${dateDuJourF} à ${hour} </p>
    </body>`
      createPDF(pdfFinal);
  }

class AreaChart10 extends React.PureComponent {
  render() {

    const tabTemperature = []

    this.props.capteur.tableauValeurs.forEach((mesure) => {
      tabTemperature.push(mesure.valeur)
    })
  
    const contentInset = { top: 20, bottom: 20 }

      return (
        <>
        <Text style={{ fontSize: 10, fontWeight: "bold" }}>{this.props.capteur.nom}</Text>
        <View style={ { height: 170, flexDirection: 'row', marginBottom:10 } }>
        <YAxis
         data={tabTemperature}
         contentInset={ contentInset }
         svg={{
           fill: 'grey',
           fontSize: 10,
         }}
         formatLabel={ value => `${value}ºC` }
        />
        <Text>{console.log(this.props.capteur.nom)}</Text>
        <Text>{console.log(tabTemperature[2])}</Text>
          <AreaChart
              style={{ flex: 1, marginLeft: 10 }}
              data={tabTemperature}
              contentInset={contentInset}
              curve={shape.curveNatural}
              svg={{ stroke: "rgb(0,0,0)",
              strokeWidth: "1" }}
              children={{y: "9"}}
          >
            
              <Grid />
          </AreaChart>
          </View></>
      )
  }
}


function RenderComponent() {

  //const List = []

  const capteurs = []


  tableauLides.forEach((lide) => {
    //capteurs.push(<Text>{lide.nom}</Text>)
    lide.tableauCapteur.forEach((capteur) => {
      capteurs.push(capteur);
    })
  })
  const list = capteurs.map(capteur => <AreaChart10 key={capteur.nom} capteur={capteur}/> )

  return (
    <View>
      {list}
    </View>
  )
}


//C'est ici que l'on va gérer le nouvel affichage

return (
  
<SafeAreaView style={styles.container}>

      <ScrollView style={styles.scrollView}>

      <Button title="capture" transparent onPress={captureViewShot}>
        <Icon name="share"/>
      </Button>

      <ViewShot  ref={viewShotRef}  options={{format:'png', quality:1.0}} >
      {MyImage}
      <RenderComponent/>
      {imgMicrolide}
      </ViewShot>
      
</ScrollView>
    </SafeAreaView>


)
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
  },
  scrollView: {
    backgroundColor: 'white',
    marginHorizontal: 20,
  },
  text: {
    fontSize: 42,
  },
  image: {
    display: ' '
  }
});

export default ChartView;