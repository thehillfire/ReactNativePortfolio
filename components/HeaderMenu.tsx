import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function HeaderMenu() {
  return (
    <View style={styles.container}>
      <TouchableOpacity>
        <MaterialCommunityIcons name="gamepad-variant" size={28} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity>
        <Ionicons name="chatbubble-ellipses-outline" size={28} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity>
        <Feather name="menu" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    backgroundColor: 'transparent',
    gap: 20,
  },
});
