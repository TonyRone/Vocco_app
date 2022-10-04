import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  View,
  Image,
  TouchableOpacity,
  Text,
  Platform,
  FlatList,
  ScrollView
} from 'react-native';

import { SvgXml } from 'react-native-svg';
import ShareIconsSvg from '../../assets/post/ShareIcons.svg';
import ShareHintSvg from '../../assets/post/ShareHint.svg';
import shareSvg from '../../assets/post/share.svg';
import cameraSvg from '../../assets/discover/camera.svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Categories, POST_CHECK, windowWidth } from '../../config/config';
import { styles } from '../style/Common';
import { TitleText } from './TitleText';
import { DescriptionText } from './DescriptionText';
import { SemiBoldText } from './SemiBoldText';
import { useTranslation } from 'react-i18next';
import closeCircleSvg from '../../assets/post/gray-close.svg';
import '../../language/i18n';
import { MyButton } from './MyButton';
import CameraRoll from "@react-native-community/cameraroll"
import { CategoryIcon } from './CategoryIcon';
import ImagePicker from 'react-native-image-crop-picker';

export const DailyPopUp = ({
  props,
  onCloseModal = () => { }
}) => {

  const { t, i18n } = useTranslation();

  const mounted = useRef(false);

  const [showModal, setShowModal] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(-2);
  const [photoInfo, setPhotoInfo] = useState(null);
  const [cameraPath, setCameraPath] = useState(null);

  const options = {
    width: 500,
    height: 500,
    compressImageMaxWidth: 500,
    compressImageMaxHeight: 500,
    avoidEmptySpaceAroundImage: true,
    cropping: true,
    cropperCircleOverlay: true,
    mediaType: "photo",
  }

  const imgLength = (windowWidth - 56) / 3;

  const closeModal = async (v = false) => {
    setShowModal(false);
    onCloseModal();
  }

  const selectFileByCamera = async () => {
    await ImagePicker.openCamera(options).then(image => {
      if (mounted.current) {
        setPhotoInfo(image);
        setPhotoIndex(-1);
        setCameraPath(image.path);
      }
    })
      .catch(err => {
        console.log(err);
      })
      ;
  }

  useEffect(() => {
    mounted.current = true;
    CameraRoll.getPhotos({
      first: 50,
      assetType: 'Photos',
    })
      .then(res => {
        if (mounted.current)
          setPhotos(res.edges);
      })
      .catch((err) => {
        console.log(err);
      });
    return () => {
      mounted.current = false;
    }
  }, [])

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showModal}
      onRequestClose={() => {
        closeModal();
      }}
    >
      <Pressable onPressOut={closeModal} style={styles.swipeModal}>
        <View style={{
          position: 'absolute',
          backgroundColor: '#FFF',
          bottom: 0,
          width: windowWidth,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          alignItems: 'center'
        }}>
          <TouchableOpacity style={{
            width: windowWidth,
            alignItems: 'flex-end',
            marginTop: 7,
            paddingRight: 12
          }}
            onPress={closeModal}
          >
            <SvgXml
              xml={closeCircleSvg}
            />
          </TouchableOpacity>
          <TitleText
            text={t("To discover world stories, share yours.")}
            color='#361252'
            maxWidth={315}
            fontSize={25.7}
            lineHeight={30}
            textAlign='center'
          />
          <View
            style={{
              width: windowWidth,
              paddingHorizontal: 18,
              marginTop: 38
            }}
          >
            <DescriptionText
              text={t("What is it all about? 👀")}
              color='#361252'
              fontSize={20}
              lineHeight={28}
              marginBottom={12}
            />
          </View>
          <FlatList
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            style={{
              width: windowWidth - 36,
            }}
            data={Categories}
            renderItem={({ item, index }) => {
              return <CategoryIcon
                key={'all_catagory' + index.toString()}
                label={item.label}
                source={item.uri}
                onPress={() => setSelectedCategory(index)}
                active={selectedCategory == index ? true : false}
              />
            }}
            keyExtractor={(item, index) => index.toString()}
          />
          <ScrollView>
            <View
              style={{
                flexWrap: 'wrap',
                flexDirection: 'row',
                alignContent: 'center',
                width: windowWidth,
                paddingHorizontal: 4,
              }}
            >
              <TouchableOpacity style={{
                height: imgLength,
                width: imgLength,
                borderRadius: 16,
                marginTop: 16,
                marginHorizontal: 8,
              }}
                onPress={selectFileByCamera}
              >
                <Image
                  source={cameraPath ? { uri: cameraPath } : require("../../assets/discover/road.png")}
                  style={{
                    width: imgLength,
                    height: imgLength,
                    borderRadius: 16,
                    borderWidth: photoIndex == -1 ? 1 : 0,
                    borderColor: '#A24EE4'
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8
                  }}
                >
                  <SvgXml
                    xml={cameraSvg}
                  />
                </View>
              </TouchableOpacity>
              {photos.map((item, index) => {
                return <TouchableOpacity
                  key={index.toString() + "gallery"}
                  onPress={() => {
                    setPhotoIndex(index);
                    setPhotoInfo({ path: item.node.image.uri, mime: item.node.type });
                  }}
                >
                  <Image
                    source={{ uri: item.node.image.uri }}
                    style={{
                      width: imgLength,
                      height: imgLength,
                      borderRadius: 16,
                      marginHorizontal: 8,
                      marginTop: 16,
                      borderWidth: index == photoIndex ? 1 : 0,
                      borderColor: '#A24EE4'
                    }}
                  />
                </TouchableOpacity>
              })}
            </View>
            <View style={{
              windowWidth: 100,
              height: 160
            }}>
            </View>
          </ScrollView>
          <View
            style={{
              position: 'absolute',
              paddingHorizontal: 16,
              width: '100%',
              bottom: 18
            }}
          >
            <MyButton
              label={t("Next step")}
              onPress={() => {
                props.navigation.navigate("HoldRecord", { photoInfo, categoryId: selectedCategory });
                closeModal();
              }}
            />
            <TouchableOpacity
              style={{
                height: 60,
                width: windowWidth - 32,
                marginTop: 22,
                borderRadius: 16,
                backgroundColor: '#FFF',
                shadowColor: 'rgba(88, 74, 117, 1)',
                elevation: 10,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 8,
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onPress={closeModal}
            >
              <TitleText
                text={t("I’ll post later")}
                fontSize={17}
                lineHeight={28}
                color="#8327D8"
              />
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};
