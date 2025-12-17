import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function Settings() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Pressable style={styles.section} onPress={() => router.push('/settings/profile')}>
        <Ionicons name="person" size={24} color="#fff" style={styles.icon} />
        <Text style={styles.sectionText}>Profile</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  sectionText: {
    color: '#fff',
    fontSize: 20,
    marginLeft: 16,
  },
  icon: {
    width: 32,
    textAlign: 'center',
  },
});
