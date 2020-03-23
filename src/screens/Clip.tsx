import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View, ScrollView, Button } from 'react-native';
import Video from 'react-native-video';
import RNFetchBlob from 'rn-fetch-blob'
import * as RNFS from 'react-native-fs';

function Clip({ navigation, route }: any) {
  const [clip, setClip] = useState<any>({
    id: null,
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
  const [videoPath, setVideoPath] = useState<string>();
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (route.params?.clip) {
      setLoading(true);
      setClip(route.params.clip);

      const fetchData = async () => {
        const data = route.params.clip;
        const path = RNFS.DocumentDirectoryPath + "/video.mp4";
        await RNFetchBlob.config({ path }).fetch('GET', data.videoUrl);
        setVideoPath(path);
        setClip({ ...data, videoUrl: path });

        // For Dev
        // const facesPath = `${RNFS.DocumentDirectoryPath}/faces`
        // await RNFS.mkdir(facesPath);

        // const faceStats = await RNFetchBlob.fs.stat(RNFetchBlob.fs.asset('lottie/placeholder/placeholder.png'));
        // const face = `file://${RNFS.DocumentDirectoryPath}/faces/placeholder.png`;
        // await RNFetchBlob.fs.cp(faceStats.path, `${facesPath}/placeholder.png`);

        // const backStats = await RNFetchBlob.fs.stat(RNFetchBlob.fs.asset('lottie/placeholder/back.png'));
        // const back = `file://${RNFS.DocumentDirectoryPath}/faces/back.png`;
        // await RNFetchBlob.fs.cp(backStats.path, `${facesPath}/back.png`);

        // const mouthStats = await RNFetchBlob.fs.stat(RNFetchBlob.fs.asset('lottie/placeholder/mouth.png'));
        // const mouth = `file://${RNFS.DocumentDirectoryPath}/faces/mouth.png`;
        // await RNFetchBlob.fs.cp(mouthStats.path, `${facesPath}/mouth.png`);

        // setClip({ ...data, videoUrl: path, face });

        setLoading(false);
      }

      fetchData();
    }
  }, [route.params?.clip]);

  return (
    <ScrollView>
      <Text>{clip.id}</Text>
      <Text>{clip.title}</Text>
      {
        !loading ?
          (<View style={styles.videoContainer}>
            <Video source={{ uri: videoPath }} resizeMode="cover" style={styles.video} />
          </View>) :
          <Text>loading...</Text>
      }
      <Button
        title="Add Face"
        onPress={() => navigation.navigate('Face', { clip })}
      />
      {/* <Button
        title="Create Video"
        onPress={() => navigation.navigate('Create', { clip })}
      /> */}
    </ScrollView>
  );
}

var styles = StyleSheet.create({
  videoContainer: {
    backgroundColor: 'black',
    width: "100%",
    height: 256,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  button: {
    backgroundColor: "#f06060",
    padding: 10
  },
  text: {
    color: "#ffffff",
    textAlign: "center"
  }
});

export default Clip;