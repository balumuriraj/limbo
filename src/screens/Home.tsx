import React, { useEffect, useState } from 'react';
import { getClips } from "../api/firestore/clips";
import { View, StyleSheet, Text, ScrollView, Button } from 'react-native';

function Home({ navigation }: any) {
  const initClips: any[] = [];
  const [clips, setClips] = useState(initClips);

  useEffect(() => {
    const fetchData = async () => {
      const results = await getClips();
      setClips([...results]);
    }

    fetchData();
  }, []);

  return (
    <ScrollView style={styles.container}>
      {
        clips.map((clip) => (
          <Button
            key={clip.id}
            title={clip.title}
            onPress={() => navigation.navigate('Clip', { clip })}
          />
        ))
      }
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
    padding: 10
  },
});

export default Home;