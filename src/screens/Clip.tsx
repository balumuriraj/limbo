import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-native';
import { Text, StyleSheet, View } from 'react-native';
import { getClip } from '../api/firestore/clips';
import Video from 'react-native-video';


function Clip(props: any) {
  let { id } = useParams();
  const [clip, setClip] = useState<any>({
    title: null,
    videoUrl: null,
    animationUrl: null,
    frames: 0,
    fps: 0,
    keywords: [],
    thumbnailUrl: null,
    thumb: null,
    width: 0,
    height: 0
  });
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    setLoading(true);

    const fetchData = async () => {
      if (id) {
        const result = await getClip(id);
        setClip(result);
      }

      setLoading(false);
    }

    fetchData();
  }, [id]);

  return (
    <>
      <Text>{id}</Text>
      <Text>{clip.title}</Text>
      {
        !loading ?
          (<View style={styles.videoContainer}>
            <Video source={{ uri: clip.videoUrl }} style={styles.video} />
          </View>) :
          null
      }
    </>
  );
}

var styles = StyleSheet.create({
  videoContainer: {
    flex: 1,
    backgroundColor: 'black',
    padding: 100
  },
  video: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default Clip;