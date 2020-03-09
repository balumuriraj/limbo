import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-native';
import { Text, StyleSheet, View, Animated, Button, Image } from 'react-native';
import { getClip } from '../api/firestore/clips';
import LottieView from 'lottie-react-native';
import { MyLottieModule, MyLottie } from '../nativeModules/MyLottieModule';
import ViewShot from "react-native-view-shot";
// import Video from 'react-native-video';

function Create() {
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
  const [animationSource, setAnimationSource] = useState<any>(null);
  const [animation, setAnimation] = useState<any>(null);
  const [animProgress, setAnimProgress] = useState<any>(null);
  const myRef: any = useRef();
  const [img, setImg] = useState<any>(null);
  // const [source, setSource] = useState<any>(null);
  // const onCapture = useCallback((uri: any) => setSource({ uri }), []);

  const showToast = async () => {
    const msg = await MyLottieModule.doPromiseTask(1);
    MyLottieModule.showToast(msg, MyLottieModule.LONG);
  }

  useEffect(() => {
    setLoading(true);

    const fetchData = async () => {
      if (id) {
        const result = await getClip(id);
        setClip(result);

        const response = await fetch(result.animationUrl);
        const data = await response.json();
        // const placeholderRes = await fetch("https://firebasestorage.googleapis.com/v0/b/funwithlimbo.appspot.com/o/media%2Fimages%2Fhead.png?alt=media&token=bd840652-803c-4016-9e7b-ae730e90b5dc");
        // const blob = await placeholderRes.blob();
        // const placeholder = "data:image/png;base64," + blob;        
        // const paths = { file: "p", folder: "u", preserveAspectRatio: "pr" };
        // data.assets.forEach((asset: any) => {
        //   asset[paths.folder] = "";
        //   asset[paths.file] = placeholder; // Override image
        //   asset["e"] = 1;
        // });
        // console.log(data);
        setAnimationSource(data);
      }

      setLoading(false);

      setTimeout(() => {
        myRef.current.capture().then((uri: string) => {
          setImg(uri);
        });
      }, 1000);
    }

    fetchData();
  }, [id]);

  return (
    <>
      <Text>{id}</Text>
      <Text>{clip.title}</Text>
      {
        !loading ?
          (<View style={styles.container}>
            <ViewShot ref={myRef} options={{ format: "jpg", quality: 0.9 }}>
              <LottieView
                source={animationSource}
                imageAssetsFolder={'lottie/placeholder'}
                ref={setAnimation}
                autoPlay
                loop
                style={styles.animation}
              />
            </ViewShot>
            <Text>loaded</Text>
            <Image
              source={{ uri: img }}
              style={{ width: 200, height: 200 }}
            />
            {/* <ViewShot onCapture={onCapture} captureMode="continuous" style={{ width: 300, height: 300 }}>
              <Video style={{ width: 300, height: 300 }} source={{ uri: clip.videoUrl }} volume={0} repeat />
            </ViewShot>

            <Text>above is a video and below is a continuous screenshot of it</Text>

            <Image fadeDuration={0} source={source} style={{ width: 300, height: 300 }} /> */}
          </View>) :
          <Text>loading...</Text>
      }
      <Link to="/" style={styles.button}>
        <Text style={styles.text}>Share Video</Text>
      </Link>
      <MyLottie style={styles.bottom}></MyLottie>
      <Button onPress={showToast} title="Toast Btn" />
    </>
  );
}

var styles = StyleSheet.create({
  container: {},
  animation: {
    width: "100%",
    height: 256
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
    height: 100
  }
});

export default Create;