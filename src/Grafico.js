import React, {Component} from 'react';
import {Text,
  View,
  Button,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import ChartView from 'react-native-highcharts';
import BluetoothSerial from 'react-native-bluetooth-serial'
import { GlobalStyles, Constants } from '../assets'

let valorPot = 0;
let dataPot = [];
let i = 0;
let isConnected = false;

dataPot.push({
  x: 0,
  y: valorPot
});
dataPot.push({
  x: 1,
  y: valorPot
});
dataPot.push({
  x: 2,
  y: valorPot
});
dataPot.push({
  x: 3,
  y: valorPot
});

type Props = {};
export default class Grafico extends Component<Props> {

    state = {
    pairedDevices: [],
    connectedDevice: null,
    connecting: false,
    isModalVisible: false,
    selectedColor: null,
    valorPot: null
    }

  isBluetoothEnabled = async () => {
    try {
      const bluetoothState = await BluetoothSerial.isEnabled()
      if (!bluetoothState) {
        this.setState({
          connectedDevice: null,
        })
        Alert.alert(
          'Bluetooth is disabled',
          'Do you want to enable bluetooth?',
          [
            {
              text: 'NO',
              onPress: () => console.log('Cancel Pressed'),
              style: 'cancel',
            },
            {
              text: 'YES',
              onPress: () => this.enableBluetoothAndRefresh(),
            },
          ],
          { cancelable: false },
        )
      }
    } catch (e) {
      console.log(e)
    }
  }

  getPairedDevices = async () => {
    try {
      const pairedDevices = await BluetoothSerial.list()
      this.setState({
        pairedDevices,
      })
    } catch (e) {
      console.log(e)
    }
  }

  enableBluetoothAndRefresh = async () => {
    try {
      await BluetoothSerial.enable()
      setTimeout(() => {
        this.getPairedDevices()
      }, 1000)
    } catch (e) {
      console.log(e)
    }
  }

  connectToDevice = async device => {
    const { connectedDevice } = this.state
    const connectedDeviceId = connectedDevice && connectedDevice.id
    if (!this.state.connecting) {
      if (device.id === connectedDeviceId) {
        alert('Already connected to this device.')
      } else {
        try {
          this.setState({
            connecting: true,
            connectedDevice: null,
          })
          
          await BluetoothSerial.connect(device.id)
          this.setState({
            connectedDevice: device,
            connecting: false,
          })
//----------------------Ouvinte para receber dados do módulo bluetooth----------------------
        BluetoothSerial.withDelimiter(' ').then(() => {
            Promise.all([
              BluetoothSerial.isEnabled(),
              BluetoothSerial.list(),
            ]).then(values => {
              const [isEnabled, devices] = values;
            });
              
              BluetoothSerial.on('read', data => {
                console.log(`DATA FROM BLUETOOTH2: ${data.data}` + ' -> Valor i: ' + i);
                  valorPot = data.data;

                  isConnected = true;
                  var time = (new Date()).getTime();
                  dataPot.push({
                    x: i,
                    y: Number(valorPot)
                  });
                  i = i + 1;
                  //console.log('valor i: ' + i + 'dataPot: ' + JSON.stringify(dataPot));
                  if(i > 800){ 
                    BluetoothSerial.disconnect(); 
                    this.setState({rend: true});
                  }
              });

          });
//------------------------------------------------------------------------------------------
        } catch (e) {
          console.log(e)
          this.setState({
            connectedDevice: null,
            connecting: false,
          })
          alert('Não foi possível conectar com o dispositivo')
        }
      }
    }
  }

  disconnect = async () => {
    if (!this.state.connecting) {
      try {
        this.setState({
          connecting: true,
        })
        await BluetoothSerial.disconnect()
        this.setState({
          connectedDevice: null,
          connecting: false,
        })
      } catch (e) {
        console.log(e)
        this.setState({
          connecting: false,
        })
      }
    }
  }

  sendStringToDevice = async data => {
    try {
      await BluetoothSerial.write(data)
      this.setState({
        selectedColor: null,
      })
    } catch (e) {
      console.log(e)
    }
    
  }

  render() {
    var Highcharts='Highcharts';
    var conf={
            chart: {
                type: 'spline',
                animation: Highcharts.svg, // don't animate in old IE
                marginRight: 10,
                events: {
                    load: function () {
                        var series = this.series[0];
                        setInterval(function () {
                            var x = i; // current t ime
                            var y = 0;//this.state.valorp;
                            series.addPoint([x, y], true, true);
                        }, 1);
                        i = i + 1;
                    }
                }
            },
            title: {
                text: 'Live random data'
            },
            xAxis: {
                type: 'datetime',
                tickPixelInterval: 50
            },
            yAxis: {
                title: {
                    text: 'Value'
                },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            },
            tooltip: {
                formatter: function () {
                    return '<b>' + this.series.name + '</b><br/>' +
                        Highcharts.dateFormat(this.x) + '<br/>' +
                        Highcharts.numberFormat(this.y, 2);
                }
            },
            legend: {
                enabled: false
            },
            exporting: {
                enabled: false
            },
            series: [{
              name: 'Valor Potenciômetro',
              data: (function () {
                    var data = [], time = (new Date()).getTime();
                    while(i < 100 && isConnected){

                    }
                    return dataPot;
                }())
            }]
        };

    const options = {
        global: {
            useUTC: false 
        },
        lang: {
            decimalPoint: ',',
            thousandsSep: '.'
        }
    };

    return (
        <ScrollView style={GlobalStyles.paddingTopSml}>
            <ChartView  style={{height:300}} config={conf} options={options}></ChartView>
        </ScrollView>
    );  
  }
}


