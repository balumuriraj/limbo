import React from 'react';
import { Link } from 'react-router-native';
import { View, StyleSheet, Text } from 'react-native';

function Menu() {
  return (
    <View style={styles.nav}>
      <Link to="/" underlayColor="#f0f4f7" style={styles.navItem}>
        <Text>Home</Text>
      </Link>
      {/* <Link to="/clip" underlayColor="#f0f4f7" style={styles.navItem}>
        <Text>Clip</Text>
      </Link> */}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: "row",
    justifyContent: "space-around"
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    padding: 10
  }
});

export default Menu;