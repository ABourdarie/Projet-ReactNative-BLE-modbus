import { Icon } from 'native-base';
import * as React from 'react';
import { Button, StyleSheet, StatusBar, SafeAreaView, ScrollView, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import ViewShot from "react-native-view-shot";
import { AreaChart, Grid } from 'react-native-svg-charts'
import * as shape from 'd3-shape'
import base64 from 'react-native-base64';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';

const NBDATE = 1440;
const NBDATE10 = 14400;
const NBDATE30 = 43200;

var pdfFinal =


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
   
   function temperaturesDatees(temperature, date, heure) {
    this.temperature = temperature;
    this.date = date;
    this.heure = heure;
  }

  const plusOrMinus = () => {
    return Math.round(Math.random()) * 2 - 1;
  } 

  var lastValue = 0;

  const calculateTemp = () => {
    lastValue += plusOrMinus();
    return lastValue;
  }

  var date = new Date(98, 1);

  var temperatureEnregistrées = []
  var tableauAvecTempUniquement = []
  var tableauAvecDateUniquement = []

  var temperatureEnregistrées10 = []
  var tableauAvecTempUniquement10 = []
  var tableauAvecDateUniquement10 = []

 
    for (let index = 0; index < NBDATE10; index++) {
        temperatureEnregistrées.push(new temperaturesDatees(calculateTemp(),date.getDate(),date.getHours()))
        tableauAvecTempUniquement.push(temperatureEnregistrées[index].temperature)
        if (!tableauAvecDateUniquement.indexOf(temperatureEnregistrées[index].date)){
            tableauAvecDateUniquement.push(temperatureEnregistrées[index].date)
        }
    }

    //C'est le dessin qui prend du temps 
    console.log(tableauAvecTempUniquement);

    temperatureEnregistrées10.push()

    for (let index = 0; index < NBDATE30; index++) {
      temperatureEnregistrées10.push(new temperaturesDatees(calculateTemp(),date.getDate(),date.getHours()))
      tableauAvecTempUniquement10.push(temperatureEnregistrées10[index].temperature)
      if (!tableauAvecDateUniquement10.indexOf(temperatureEnregistrées10[index].date)){
          tableauAvecDateUniquement10.push(temperatureEnregistrées10[index].date)
      }
  }

const ChartView = () => {

  const viewShotRef = React.useRef();
  const viewShotRef2 = React.useRef();

  async function captureViewShot() {
    const imagebase64 = await viewShotRef.current.capture();
    pdfFinal += `<img src=${imagebase64} alt="chart1"> <br> <img src=${ await viewShotRef2.current.capture()} alt="chart2">  `;
      createPDF(pdfFinal);
  }

class AreaChart30 extends React.PureComponent {
  render() {

      return (
          <AreaChart
              style={{ height: 200 }}
              data={tableauAvecTempUniquement10}
              contentInset={{ top: 30, bottom: 30 }}
              curve={shape.curveNatural}
              svg={{ stroke: "rgb(0,0,0)",
              strokeWidth: "1" }}
              children={{y: "9"}}
          >
            
              <Grid />
          </AreaChart>
          
      )
  }
}

class AreaChart10 extends React.PureComponent {
  render() {
  
      return (
          <AreaChart
              style={{ height: 200 }}
              data={tableauAvecTempUniquement}
              contentInset={{ top: 30, bottom: 30 }}
              curve={shape.curveNatural}
              svg={{ stroke: "rgb(0,0,0)",
              strokeWidth: "1" }}
              children={{y: "9"}}
          >
            
              <Grid />
          </AreaChart>
          
      )
  }
}



//  on essaye de changer l'image
return (
  
<SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>

      <Button title="capture" transparent onPress={captureViewShot}>
        <Icon name="share"/>
      </Button>

      <ViewShot  ref={viewShotRef}  options={{format:'png', quality:1.0}} >
        <AreaChart10/>
      </ViewShot>

      <ViewShot  ref={viewShotRef2}  options={{format:'png', quality:1.0}} >
        <AreaChart30/>
      </ViewShot>

  {/* Ancien Type de graphh */}

  {/* <Button title="capture" transparent onPress={captureViewshot}>
    <Icon name="share"/>
  </Button>


  <Text>Réfrégirateur 1</Text>


  <ViewShot  ref={viewShotRef}  options={{format:'jpg', quality:1.0}} >
  <LineChart
    data={{
      labels: tableauAvecDateUniquement,
      datasets: [
        {
          data: tableauAvecTempUniquement
        }
      ]
    }}
    width={Dimensions.get("window").width} // from react-native
    height={220}
    yAxisSuffix="°C"
    yAxisInterval={1} // optional, defaults to 1
    chartConfig={{
        color: (opacity = 1) => `rgba(44, 197, 231, ${opacity})`,
        strokeWidth: 2, // optional, default 3
        barPercentage: 0.5,
        useShadowColorFromDataset: false,  // optional
        backgroundGradientFrom: '#FFFFFF',
        backgroundGradientTo: '#FFFFFF',
      style: {
        borderRadius: 16
      },
      propsForDots: {
        r: "2",
      }
    }}
    bezier
    style={{
      marginVertical: 8,
      borderRadius: 16
    }}
  />
  </ViewShot>


<Text>Réfrégirateur 10</Text>


  <LineChart
    data={{
      labels: tableauAvecDateUniquement10,
      datasets: [
        {
          data: tableauAvecTempUniquement10
        }
      ]
    }}
    width={Dimensions.get("window").width} // from react-native
    height={220}
    yAxisSuffix="°C"
    yAxisInterval={1} // optional, defaults to 1
    withDots
    chartConfig={{
        color: (opacity = 1) => `rgba(44, 197, 231, ${opacity})`,
        strokeWidth: 2, // optional, default 3
        barPercentage: 0.5,
        useShadowColorFromDataset: false,  // optional
        backgroundGradientFrom: '#FFFFFF',
        backgroundGradientTo: '#FFFFFF',
        withOuterLines: false,
        withHorizontalLines: false,
        withInnerLines: false,
      style: {
        borderRadius: 16
      },
      propsForDots: {
        r: "1",
      }
    }}
    bezier
    style={{
      marginVertical: 8,
      borderRadius: 16
    }}
  /> */}

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
});

export default ChartView;