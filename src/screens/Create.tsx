import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { RNFFmpeg } from 'react-native-ffmpeg';
import { MyLottieModule } from '../nativeModules/MyLottieModule';
import * as RNFS from 'react-native-fs';
import Video from 'react-native-video';

// TODO: check ios support for RNFS.DocumentDirectoryPath        
const dirPath = RNFS.DocumentDirectoryPath;
const framesPath = `${dirPath}/frames`;
const facesPath = `${dirPath}/faces`;

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
    height: 0,
    face: null
  });
  const [loading, setLoading] = useState(true);
  const [outputPath, setOutputPath] = useState<any>(null);

  useEffect(() => {
    if (route.params?.clip) {
      setLoading(true);
      setClip(route.params.clip);

      const fetchData = async () => {
        const result = route.params.clip;

        // create frames dir
        await RNFS.mkdir(framesPath);        

        // extract frames to frames dir
        const framesOutPath = `${framesPath}/frame-%04d.jpg`;
        await RNFFmpeg.execute(`-i ${result.videoUrl} -y -r ${result.fps} ${framesOutPath}`);

        // process frames with animation frames
        await MyLottieModule.processFrames(framesPath, `file://${facesPath}`, result.animationUrl, result.frames, result.width, result.height);

        // generate video from processed frames
        await RNFFmpeg.execute(`-i ${framesOutPath} -y -r ${result.fps} ${dirPath}/output.mp4`);
        setOutputPath(`${dirPath}/output.mp4`);

        // delete frames dir
        await RNFS.unlink(framesPath);        
      }

      try {
        fetchData();
      } finally {
        setLoading(false);
      }
    }
  }, [route.params?.clip]);

  return (
    <>
      <Text>{clip.id}</Text>
      <Text>{clip.title}</Text>
      {
        loading ? <Text>loading...</Text> :
          (<View style={styles.container}>
            <Text>loaded</Text>
            { outputPath ? <Video source={{ uri: outputPath }} resizeMode="contain" style={{ ...styles.video }} /> : null }
          </View>)

      }
    </>
  );
}

var styles = StyleSheet.create({
  container: {
    backgroundColor: "#aaaaaa",
    flex: 1,
    margin: 5
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