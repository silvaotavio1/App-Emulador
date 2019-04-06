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
import BluetoothSerial from 'react-native-bluetooth-serial'
import ChartView from 'react-native-highcharts'
import { GlobalStyles, Constants } from '../assets'

let valorPot = 0;
let dataPot = [];
let i = 0;
let isConnected = false;

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

    async componentWillMount() {
      await this.getPairedDevices()
      await this.isBluetoothEnabled()
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
                  if(i <= 800){ 
                    var time = (new Date()).getTime();
                  dataPot.push({
                    x: i,
                    y: Number(valorPot)
                  });
                  i = i + 1;
                }
                  //console.log('valor i: ' + i + 'dataPot: ' + JSON.stringify(dataPot));
                  if(i > 800){ 
                    //BluetoothSerial.disconnect(); 
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

                // set up the updating of the chart each second
                var series = this.series[0];
                setInterval(function () {
                    var x = (new Date()).getTime(), // current time
                        y = Math.random();
                    series.addPoint([x, y], true, true);
                }, 1000000);
            }
        }
    },
          title: {
              text: 'Live random data'
          },
          xAxis: {
              type: 'number',
              tickPixelInterval: 150
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
                      Highcharts.numberFormat(this.x, 2) + '<br/>' +
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
              name: 'Random data',
              data: (function () {
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

      {!!this.state.connectedDevice &&
        <ChartView  style={{height:300}} config={conf} options={options}></ChartView>
      }
      
      {!this.state.connectedDevice &&
      <View>
        <View style={GlobalStyles.flex1}>
            <TouchableOpacity onPress={this.getPairedDevices}>
              <Text>Atualizar</Text>
            </TouchableOpacity>
            <FlatList
              contentContainerStyle={GlobalStyles.paddingTop}
              data={this.state.pairedDevices}
              keyExtractor={item => item.id}
              ItemSeparatorComponent={() =>
                <View
                  style={[
                    { height: 1, backgroundColor: Constants.BORDER },
                    GlobalStyles.marginVerticalSml,
                  ]}
                />}
              renderItem={({ item: device }) =>
                <TouchableOpacity onPress={() => this.connectToDevice(device)}>
                  <Text style={GlobalStyles.subheading}>
                    {device.name}
                  </Text>
                  <Text style={GlobalStyles.body}>
                    {device.id}
                  </Text>
                </TouchableOpacity>}
            />
          </View>
          <View style={GlobalStyles.materialCard}>
            {this.state.connecting
              ? <View
                  style={[GlobalStyles.centerAligned, GlobalStyles.padding]}
                >
                  <ActivityIndicator
                    size={'large'}
                    color={Constants.PRIMARY_COLOR}
                  />
                  <Text style={GlobalStyles.body1}>Connecting...</Text>
                </View>
              : <View>
                  <Text style={[GlobalStyles.subheading, { fontSize: 20 }]}>
                    {!!this.state.connectedDevice
                      ? 'Connected to:'
                      : 'Not connected'}
                  </Text>
                  {!!this.state.connectedDevice &&
                    <View style={GlobalStyles.paddingTopSml}>
                      <Text style={GlobalStyles.subheading}>
                        {this.state.connectedDevice.name}
                      </Text>
                      <Text style={GlobalStyles.body}>
                        {this.state.connectedDevice.id}
                      </Text>
                      <Text
                        style={GlobalStyles.body1}
                        onPress={this.disconnect}
                      >
                        Disconnect
                      </Text>
                      {!!this.state.selectedColor &&
                        <View
                          style={{
                            position: 'absolute',
                            top: 15,
                            right: 15,
                            height: 40,
                            width: 40,
                            borderRadius: 20,
                            backgroundColor: this.state.selectedColor,
                            borderWidth: 0.5,
                            borderColor: Constants.BORDER,
                          }}
                        />}
                    </View>}
                </View>}
            {!!this.state.connectedDevice &&
              <View style={GlobalStyles.paddingTop}>

                <View style={GlobalStyles.paddingBottomSml}>
                  <Button
                    title={'TURN ON LED'}
                    color={Constants.PRIMARY_COLOR}
                    onPress={() => this.sendStringToDevice('999,')}
                  />
                </View>

                <View style={GlobalStyles.paddingBottomSml}>
                  <Button
                    title={'TURN OFF LED'}
                    color={Constants.SECONDARY_COLOR}
                    onPress={() => this.sendStringToDevice('998,')}
                  />
                </View>

                <View style={GlobalStyles.paddingBottomSml}>
                  <Button
                    title={'PLOTAR VALORES'}
                    color={Constants.BLACK}
                    onPress={() => this.props.navigation.navigate('Grafico')}
                  />
                </View>

                <View style={GlobalStyles.paddingBottomSml}>
                  <Button
                    title={'PICK COLOR'}
                    color={Constants.PRIMARY_COLOR}
                    onPress={() =>
                      this.setState({
                        isModalVisible: true,
                      })}
                  />
                </View>

              </View>}
          </View>
          </View>}
        </ScrollView>
    );  
  }
}


