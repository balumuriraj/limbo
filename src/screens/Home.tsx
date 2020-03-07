import React, { useEffect, useState } from 'react';
import { getClips } from "../api/firestore/clips";
import { Link } from 'react-router-native';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import Clip from './Clip';

function Home() {
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
          <Link
            key={clip.id}
            to={`clip/${clip.id}`}
            underlayColor="#f0f4f7"
          >
            <Text>{clip.title}</Text>
          </Link>
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