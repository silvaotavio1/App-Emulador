import {createStackNavigator, createAppContainer} from 'react-navigation';
import Home from './src/Home.js';
import Grafico from './src/Grafico.js';

const MainNavigator = createStackNavigator({
  Home: {screen: Home},
  Grafico: {screen: Grafico},
});

const App = createAppContainer(MainNavigator);

export default App;