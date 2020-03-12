import React, { useState, useEffect, useRef } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { RNFFmpeg } from 'react-native-ffmpeg';
import { MyLottieModule } from '../nativeModules/MyLottieModule';
import * as RNFS from 'react-native-fs';
import Video from 'react-native-video';

// TODO: check ios support for RNFS.DocumentDirectoryPath        
const dirPath = RNFS.DocumentDirectoryPath;
const framesPath = `${dirPath}/frames`;

function Create({ navigation, route }: any) {
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
  const [loading, setLoading] = useState(true);
  const myRef: any = useRef();
  const [img, setOutputUrl] = useState<any>(null);

  useEffect(() => {
    setLoading(true);

    const fetchData = async () => {
      // create frames dir
      await RNFS.mkdir(framesPath);

      if (route.params?.clip) {
        const result = route.params.clip;
        setClip(result);

        // extract frames to frames dir
        const framesOutPath = `${framesPath}/frame-%04d.jpg`;
        await RNFFmpeg.execute(`-i ${result.videoUrl} -y -r ${result.fps} ${framesOutPath}`);

        // process frames with animation frames
        await MyLottieModule.processFrames(framesPath, result.animationUrl, result.frames, result.width, result.height);

        // generate video from processed frames
        await RNFFmpeg.execute(`-i ${framesOutPath} -y -r ${result.fps} ${dirPath}/output.mp4`);
        setOutputUrl(`${dirPath}/output.mp4`);

        // delete frames dir
        await RNFS.unlink(framesPath);
      }

      setLoading(false);
    }

    fetchData();
  }, [route.params?.clip]);

  return (
    <>
      <Text>{clip.id}</Text>
      <Text>{clip.title}</Text>
      {
        loading ? <Text>loading...</Text> :
          (<View style={styles.container}>
            <Text>loaded</Text>
            <Video source={{ uri: img }} resizeMode="cover" style={{ ...styles.video, width: "100%", height: clip.height }} />
          </View>)

      }
    </>
  );
}

var styles = StyleSheet.create({
  container: {
    backgroundColor: "#aaaaaa",
  },
  button: {
    backgroundColor: "#f06060",
    padding: 10
  },
  text: {
    color: "#ffffff",
    textAlign: "center"
  },
  bottom: {
    width: "100%",
    height: 50
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});

export default Create;