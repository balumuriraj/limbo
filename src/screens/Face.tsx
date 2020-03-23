import React, { useState, useEffect, useRef } from 'react';
import { Text, StyleSheet, View, Button, Image, Dimensions } from 'react-native';
import ImagePicker from 'react-native-image-picker';
import * as RNFS from 'react-native-fs';
import Editor from '../components/Editor';

const { width, height } = Dimensions.get('window');

function Face({ navigation, route }: any) {
  const editorRef = useRef<Editor>(null);
  const [loading, setLoading] = useState(true);
  const [imageUri, setImageUri] = useState<any>(null);
  const [outputPath, setOutputPath] = useState<any>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [clip, setClip] = useState<any>(null);

  useEffect(() => {
    if (route.params?.clip) {
      setLoading(true);
      setClip(route.params.clip);

      ImagePicker.launchImageLibrary({ title: 'Select Photo' }, async (response) => {
        try {
          await RNFS.copyFile(response.path as any, `${RNFS.DocumentDirectoryPath}/face.png`);
          setOutputPath(`file://${RNFS.DocumentDirectoryPath}/face.png`);
          setSize({ width: response.width, height: response.height });
        } finally {
          setLoading(false);
        }
      });
    }
  }, [route.params?.clip]);

  const process = async () => {
    const imgUri = await editorRef.current?.processImage();
    setImageUri(imgUri);
  }

  const reset = () => {
    setImageUri(null);
  }

  const finish = () => {
    const updatedClip = { ...clip, face: imageUri };
    console.log(imageUri);
    navigation.navigate('Create', { clip: updatedClip });
  }

  return (
    <>
      <Text>Select Face</Text>
      {
        loading ? <Text>loading...</Text> :
          (<View style={styles.container}>
            <Text>loaded</Text>
            {
              imageUri ?
                <Image source={{ uri: imageUri }} style={{ width, height: width }} /> :
                <Editor ref={editorRef} url={outputPath} size={size}></Editor>
            }
          </View>)
      }
      {
        imageUri ?
          <><Button title="Reset" onPress={reset} /><Button title="Finish" onPress={finish} /></> :
          <><Button title="Reset" onPress={reset} /><Button title="Done" onPress={process} /></>
      }
    </>
  );
}

var styles = StyleSheet.create({
  container: {
    // flex: 1
  }
});

export default Face;