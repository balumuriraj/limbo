/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React from 'react';
import { StyleSheet, View, Text, Platform, InteractionManager } from 'react-native';

import { NativeRouter, Route } from "react-router-native";
import Menu from './src/components/Menu';
import Home from './src/screens/Home';
import Clip from './src/screens/Clip';
import { initFixes } from './src/utils/fixes';

initFixes();

const App = () => {
  return (
    <NativeRouter>
      <View style={styles.container}>
        <Menu />
        <Route exact path="/" component={Home} />
        <Route path="/clip/:id" component={Clip} />
      </View>
    </NativeRouter>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
    padding: 10
  }
});

export default App;
