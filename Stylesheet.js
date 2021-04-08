//----------------------------StyleSheet----------------------------//

// Test border
//borderWidth: 5,
//borderColor: 'red',

import {
    StyleSheet,
    Dimensions
} from 'react-native';

// Get user device size
const windowWidth = Dimensions.get('window').width;

export default styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        width: '100%',
        height: '100%'
    },
    contentContainer: {
        width: '100%',
        minHeight: '80%',
        textAlign: 'center'
    },
    mainContainer: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
    },
    resultContainer: {
        fontSize: windowWidth * 0.01,
        width: '100%',
        color: 'rgba(96,100,109, 1)',
        lineHeight: 24,
        alignItems: 'center',
        padding: windowWidth * 0.01,

    },
    notrightContainer: {
        padding: windowWidth * 0.01
    },
    text: {
        fontSize: windowWidth * 0.05,
        margin: windowWidth * 0.01
    },
    resultImage: {
        margin: windowWidth * 0.01,
        height: windowWidth * 0.8,
        width: windowWidth * 0.8,
        borderWidth: windowWidth*0.005,
        borderColor: '#3D03A8'
    },
    resultUserImage: {
        margin: windowWidth * 0.01,
        height: windowWidth * 0.3,
        width: windowWidth * 0.3,
        borderWidth: windowWidth*0.005,
        borderColor: '#3D03A8'
    },
    notrightIndividualContainer: {
        alignItems: 'center',
        marginBottom: windowWidth*0.05,
    },
    stars: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    challengeImageUndiscovered: {
        borderWidth: windowWidth*0.005,
        borderColor: '#3D03A8',
        opacity: 0.5,
        height: '70%',
        aspectRatio: 1
    },
    challengeImageDiscovered: {
        borderWidth: windowWidth*0.005,
        borderColor: '#3D03A8',
        opacity: 1,
        height: '70%',
        aspectRatio: 1
    },
    challengeText:{
        fontSize: windowWidth*0.02
    },
    challengeCardDiscovered: {
        borderWidth: windowWidth*0.005,
        borderColor: '#3D03A8',
        alignItems: 'center',
        padding: windowWidth*0.005,
        height: windowWidth*0.5,
        backgroundColor: '#d1b6fc',
    },
    challengeCardUndiscovered: {
        borderWidth: windowWidth*0.005,
        borderColor: '#3D03A8',
        alignItems: 'center',
        padding: windowWidth*0.005,
        backgroundColor: 'lightgrey',
        height: windowWidth*0.5,
        textAlign: 'center'
    },
    challengeCardView: {
        width: '48%',
        margin: '1%',
    },
    challengeDisplay: {
        width: '100%',
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    challengePage: {
        alignItems: 'center',
        padding: windowWidth*0.01,
        width: '100%'
    },
    resultPartContainer: {
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0,
        borderWidth: windowWidth*0.005,
        borderRadius: 10,
        borderColor: '#3D03A8',
        alignItems: 'center',
        marginBottom: windowWidth*0.005,
        alignSelf: "stretch",

    },
    resultPartContainerTitle: {
        backgroundColor: "#3D03A8",
        padding: windowWidth*0.01,
        color: 'white',
        alignSelf: "stretch",
        textAlign: 'center',
        fontSize: windowWidth*0.05
    },
    resultPartContainerImage: {
        height: windowWidth*0.3,
        aspectRatio: 1,
        margin: windowWidth*0.01,
        borderWidth: windowWidth*0.005,
        borderColor: "#3D03A8"

    },
    resultImageContainer: {
        flexDirection: 'row',
        width: '100%',
        margin: windowWidth*0.01,
    },
    challengeCompleteModalView: {
        borderWidth: windowWidth*0.005,
        borderRadius: 20,
        borderColor: "#3D03A8",
        flex: 1,
        marginLeft: '5%',
        marginRight: '5%',
        marginTop: '30%',
        marginBottom: '30%',
        alignItems: "center",
        backgroundColor: 'white',
    },
    challengeCompleteModalViewButton: {
        fontSize: windowWidth*0.01,
        alignSelf: 'center',
        margin: windowWidth*0.02,
        width: "50%"
    },
    challengeCompleteModalViewText: {
        fontSize: windowWidth*0.04,
        backgroundColor: '#3D03A8',
        color: 'white',
        width: '100%',
        textAlign: 'center'
    },
    userLevelView: {
        alignItems: 'center',
        marginTop: windowWidth*0.04,
        marginBottom: windowWidth*0.02,
        padding: windowWidth*0.02,
        borderBottomWidth: windowWidth*0.01,
        borderColor: '#3D03A8'
    },
    bottomNavigation: {
        borderTopWidth: windowWidth*0.01,
        borderColor: '#3D03A8',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        maxHeight: windowWidth*0.2,
        bottom: 0
    },
    bottomNavigationButton: {
        alignItems: 'center',
        flex: 1,
        marginTop: windowWidth*0.01
    },
    bottomNavigationText: {
        fontSize: windowWidth*0.05,
        color: '#3D03A8',
        marginLeft: windowWidth*0.01,
        marginRight: windowWidth*0.01
    },
    welcomeText: {
        fontSize: windowWidth * 0.05,
        margin: windowWidth * 0.05
    },
    settingsButton: {
        alignItems: 'center',
        marginTop: windowWidth*0.01,
    },
    uploadButton: {
        alignItems: 'center',
        flexDirection: 'row',
        borderWidth: windowWidth * 0.004,
        borderRadius: windowWidth * 0.05,
        borderColor: '#3D03A8',
        minHeight: '20%',
        padding: '2%',
        justifyContent: 'center',
        marginLeft: '5%',
        marginRight: '5%',
    },
    uploadButtonText: {
        paddingLeft: '5%',
        alignSelf: 'center',
        color: '#3D03A8',
        fontSize: windowWidth * 0.04,
        textAlign: 'center',
    },
    uploadContent: {
        flexDirection: 'row',
        justifyContent: 'center',
        height: '5%',
        width: '100%',
    },

    finalDisplayTopContainer: {
        flex: 1,
        flexDirection: 'row',
        width: '100%',
        maxHeight: windowWidth*0.1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    finalDisplayButtons: {
        alignItems: 'center',
        flexDirection: 'row',
        borderWidth: windowWidth * 0.004,
        borderRadius: windowWidth * 0.05,
        borderColor: '#3D03A8',
        padding: '2%',
        justifyContent: 'center',
        margin: '2%'
    },
    finalDisplayButtonsText: {
        paddingLeft: '1%',
        alignSelf: 'center',
        color: '#3D03A8',
        fontSize: windowWidth * 0.02,
        textAlign: 'center',
    },
    complexityButton: {
        marginTop: '1%',
        height: "10%",
        width: "100%",
        justifyContent: 'center',
        alignItems: 'center',
        margin: 'auto',
        display: 'flex'

    },
    button: {
        borderRadius: 30,
        backgroundColor: '#3D03A8',
        margin: '1%',
        minHeight: "5%",
        minWidth: "60%",
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonText: {
        color: 'white',
        fontSize: windowWidth * 0.05
    },
    savedView: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    savedImage: {
        margin: windowWidth * 0.01,
        width: windowWidth * 0.4,
        aspectRatio: 1,
        borderWidth: windowWidth*0.005,
        borderColor: '#3D03A8',
    },
    savedCard:{
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: windowWidth*0.005,
        borderColor: '#3D03A8',
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        width: '80%',
        margin: windowWidth*0.02
    },
    savedCardTitle: {
        backgroundColor: "#3D03A8",
        padding: windowWidth*0.01,
        color: 'white',
        alignSelf: "stretch",
        textAlign: 'center',
        fontSize: windowWidth*0.05,
    },
    map: {
        width: windowWidth*0.6,
        height: windowWidth*0.6
    }
});